import { createUIMessageStream, JsonToSseTransformStream } from "ai";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import { auth } from "@/app/(auth)/auth";
import {
  createGuestUser,
  createStreamId,
  deleteChatById,
  getChatById,
  getUserById,
  saveChat,
  saveMessages,
  updateChatUserIdById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { generateUUID, getTextFromMessage } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        if (isDevelopment) {
          console.log(
            " > Resumable streams are disabled due to missing REDIS_URL"
          );
        }
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

const isDevelopment = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedVisibilityType,
      businessFunction = "AI Accelerate",
    } = requestBody;

    if (isDevelopment) {
      console.log("=== API CHAT POST DEBUG ===");
      console.log("Chat ID:", id);
      console.log("Message:", message);
      console.log("===========================");
    }

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Parallelize database queries for better performance
    const [chat, existingUser] = await Promise.all([
      getChatById({ id }),
      getUserById(session.user.id),
    ]);

    // Ensure user exists in database, create guest if not
    let currentUserId = session.user.id;

    if (!existingUser) {
      // User was deleted from DB but session still has old ID
      // If chat exists and belongs to a guest user, reuse that guest user
      if (chat) {
        const chatOwner = await getUserById(chat.userId);
        if (chatOwner?.email?.startsWith("guest-")) {
          // Chat belongs to a guest user, reuse that user ID
          currentUserId = chat.userId;
        } else {
          // Create new guest user
          const [newGuestUser] = await createGuestUser();
          currentUserId = newGuestUser.id;
        }
      } else {
        // No chat yet, create new guest user
        const [newGuestUser] = await createGuestUser();
        currentUserId = newGuestUser.id;
      }
    }

    // Handle chat ownership and creation
    if (chat) {
      // Check if chat's owner still exists (only if needed)
      if (chat.userId !== currentUserId) {
        const chatOwner = await getUserById(chat.userId);
        // If chat owner exists but is different user, deny access
        if (chatOwner) {
          // Chat belongs to a different existing user, deny access
          return new ChatSDKError("forbidden:chat").toResponse();
        }
        // Chat owner doesn't exist (was deleted), allow access and update chat ownership
        // Update chat to belong to current user
        await updateChatUserIdById({ chatId: id, userId: currentUserId });
      }
    } else {
      // Extract text early for title generation
      const userMessageText = getTextFromMessage(message);
      if (!userMessageText) {
        return new ChatSDKError("bad_request:api").toResponse();
      }

      // Generate title and save chat in parallel
      const [title] = await Promise.all([
        generateTitleFromUserMessage({ message }),
      ]);

      await saveChat({
        id,
        userId: currentUserId, // Use existing or newly created user ID
        title,
        visibility: selectedVisibilityType,
      });
    }

    // Extract text from the latest user message
    const userMessageText = getTextFromMessage(message);

    if (!userMessageText) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    // Save user message to database
    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Generate streamId while preparing n8n request (non-blocking)
    const streamId = generateUUID();
    const createStreamIdPromise = createStreamId({ streamId, chatId: id });

    // Get n8n configuration from environment variables
    // Updated webhook: https://n8n.srv734188.hstgr.cloud/webhook/34f19691-dbbb-43e5-be8a-f4b22f20458e/:businessFunction
    const n8nBaseUrl =
      process.env.N8N_BASE_URL || "https://n8n.srv734188.hstgr.cloud";
    const n8nWebhookId =
      process.env.N8N_WEBHOOK_ID || "34f19691-dbbb-43e5-be8a-f4b22f20458e";

    // Build webhook URL with businessFunction as path parameter
    // Format: /webhook/{webhookId}/{businessFunction}
    // URL encode the businessFunction to handle spaces (e.g., "AI Accelerate" -> "AI%20Accelerate")
    const encodedBusinessFunction = encodeURIComponent(businessFunction);
    const n8nWebhookUrl = `${n8nBaseUrl}/webhook/${n8nWebhookId}/${encodedBusinessFunction}`;

    if (isDevelopment) {
      console.log("=== N8N WEBHOOK CONFIGURATION ===");
      console.log(
        "N8N_BASE_URL env:",
        process.env.N8N_BASE_URL || "using default"
      );
      console.log(
        "N8N_WEBHOOK_ID env:",
        process.env.N8N_WEBHOOK_ID || "using default"
      );
      console.log("Resolved n8nBaseUrl:", n8nBaseUrl);
      console.log("Resolved n8nWebhookId:", n8nWebhookId);
      console.log("Final webhook URL:", n8nWebhookUrl);
      console.log("Business Function:", businessFunction);
      console.log("==================================");
    }

    // Prepare request body for n8n
    // Send data directly without wrapping in "body" key
    // Note: promptTemplate is NOT sent as it's already configured in n8n's system prompt
    const n8nRequestBody: {
      message: string;
      sessionId: string;
      userId: string;
      functions?: string[] | null;
    } = {
      message: userMessageText,
      sessionId: id, // Use chat ID as session ID
      userId: currentUserId,
    };

    // Only include functions array if businessFunction is not AI Accelerate
    // For AI Accelerate, send null
    const shouldIncludeBusinessFunction = businessFunction !== "AI Accelerate";

    if (shouldIncludeBusinessFunction) {
      n8nRequestBody.functions = [businessFunction];
    } else {
      n8nRequestBody.functions = null;
    }

    // Ensure streamId is created (non-blocking, but we'll wait for it)
    await createStreamIdPromise;

    // Call n8n webhook with timeout and keep-alive
    let n8nResponse: Response;
    try {
      if (isDevelopment) {
        console.log("Calling n8n webhook:", n8nWebhookUrl);
        console.log("Request body:", JSON.stringify(n8nRequestBody, null, 2));
      }

      // Create AbortController for timeout (30 seconds max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        n8nResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept:
              "application/json, text/event-stream, application/stream+json",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
          },
          body: JSON.stringify(n8nRequestBody),
          signal: controller.signal,
          // Enable keep-alive for connection reuse
          keepalive: true,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          console.error("n8n webhook request timed out after 30 seconds");
          return new ChatSDKError("offline:chat").toResponse();
        }
        throw fetchError;
      }

      if (isDevelopment) {
        console.log(
          "n8n response status:",
          n8nResponse.status,
          n8nResponse.statusText
        );
        console.log(
          "n8n response Content-Type:",
          n8nResponse.headers.get("Content-Type")
        );
      }

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error("n8n webhook error - Status:", n8nResponse.status);
        console.error("n8n webhook error - Response:", errorText);
        return new ChatSDKError("offline:chat").toResponse();
      }
    } catch (error) {
      console.error("Failed to call n8n webhook - Error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return new ChatSDKError("offline:chat").toResponse();
    }

    // Check if response is streaming
    const contentType = n8nResponse.headers.get("Content-Type") || "";
    const isStreaming =
      contentType.includes("text/event-stream") ||
      contentType.includes("text/stream") ||
      contentType.includes("application/stream+json") ||
      n8nResponse.body !== null;

    // Generate ID for assistant message
    const assistantMessageId = generateUUID();

    if (isStreaming && n8nResponse.body) {
      // Handle streaming response
      if (isDevelopment) {
        console.log("Processing streaming response from n8n");
      }

      const stream = createUIMessageStream<ChatMessage>({
        execute: async ({ writer: dataStream }) => {
          let accumulatedText = "";
          let rawJsonBuffer = ""; // Buffer for accumulating the JSON string being streamed
          let parsedResponse = ""; // The actual response text extracted from JSON
          let buffer = "";

          try {
            const body = n8nResponse.body;
            if (!body) {
              throw new Error("Response body is null");
            }

            const reader = body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              // Decode chunk
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // Process buffer based on content type
              // n8n streams JSON Lines format: {"type":"item","content":"text","metadata":{...}}\n
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer

              for (const line of lines) {
                if (!line.trim()) {
                  continue; // Skip empty lines
                }

                try {
                  const data = JSON.parse(line);

                  // Handle n8n streaming format: {"type":"item","content":"text chunk"}
                  if (data.type === "item" && data.content) {
                    const contentChunk = data.content;
                    rawJsonBuffer += contentChunk;

                    // Try to parse the accumulated JSON string
                    // This handles the case where n8n is streaming a JSON object character by character
                    try {
                      const parsedJson = JSON.parse(rawJsonBuffer);
                      // We have a valid parsed JSON with a response field
                      // Only update if the response text has changed (to avoid duplicate streaming)
                      if (
                        parsedJson.response &&
                        typeof parsedJson.response === "string" &&
                        parsedResponse !== parsedJson.response
                      ) {
                        parsedResponse = parsedJson.response;
                        // Stream only the response text, not the raw JSON
                        dataStream.write({
                          type: "data-appendMessage",
                          data: JSON.stringify({
                            id: assistantMessageId,
                            role: "assistant",
                            parts: [{ type: "text", text: parsedResponse }],
                          }),
                          transient: true,
                        });
                      }
                    } catch {
                      // JSON is not complete yet, continue accumulating
                      // Don't stream incomplete JSON - wait until we can parse it
                    }
                  }
                  // Handle legacy formats for backward compatibility
                  else if (data.response || data.text || data.delta) {
                    const text = data.response || data.text || data.delta || "";
                    accumulatedText += text;
                    dataStream.write({
                      type: "data-appendMessage",
                      data: JSON.stringify({
                        id: assistantMessageId,
                        role: "assistant",
                        parts: [{ type: "text", text: accumulatedText }],
                      }),
                      transient: true,
                    });
                  }
                  // Skip "begin" and other non-content events
                } catch {
                  // If not JSON, might be plain text (fallback)
                  if (line.trim()) {
                    accumulatedText += line;
                    dataStream.write({
                      type: "data-appendMessage",
                      data: JSON.stringify({
                        id: assistantMessageId,
                        role: "assistant",
                        parts: [{ type: "text", text: accumulatedText }],
                      }),
                      transient: true,
                    });
                  }
                }
              }
            }

            // Process remaining buffer
            if (buffer.trim()) {
              try {
                const data = JSON.parse(buffer);
                // Handle n8n streaming format
                if (data.type === "item" && data.content) {
                  rawJsonBuffer += data.content;
                  // Try to parse the accumulated JSON
                  try {
                    const parsedJson = JSON.parse(rawJsonBuffer);
                    if (
                      parsedJson.response &&
                      typeof parsedJson.response === "string" &&
                      parsedResponse !== parsedJson.response
                    ) {
                      parsedResponse = parsedJson.response;
                      dataStream.write({
                        type: "data-appendMessage",
                        data: JSON.stringify({
                          id: assistantMessageId,
                          role: "assistant",
                          parts: [{ type: "text", text: parsedResponse }],
                        }),
                        transient: true,
                      });
                    }
                  } catch {
                    // JSON not complete yet
                  }
                } else if (data.response || data.text) {
                  const text = data.response || data.text || "";
                  accumulatedText += text;
                  dataStream.write({
                    type: "data-appendMessage",
                    data: JSON.stringify({
                      id: assistantMessageId,
                      role: "assistant",
                      parts: [{ type: "text", text: accumulatedText }],
                    }),
                    transient: true,
                  });
                }
              } catch {
                // If not JSON, treat as plain text
                accumulatedText += buffer;
                dataStream.write({
                  type: "data-appendMessage",
                  data: JSON.stringify({
                    id: assistantMessageId,
                    role: "assistant",
                    parts: [{ type: "text", text: accumulatedText }],
                  }),
                  transient: true,
                });
              }
            }

            // Determine final text to use (prefer parsed response, fallback to accumulated)
            const finalText = parsedResponse || accumulatedText;

            // Only process if we have text
            if (!finalText.trim()) {
              if (isDevelopment) {
                console.warn("Stream completed but no text was accumulated");
              }
              return;
            }

            // Save complete message to database
            try {
              await saveMessages({
                messages: [
                  {
                    id: assistantMessageId,
                    role: "assistant",
                    parts: [{ type: "text", text: finalText }],
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
              if (isDevelopment) {
                console.log("Assistant message saved to database");
              }
            } catch (error) {
              console.error(
                "Error saving assistant message to database:",
                error
              );
            }

            // Send final message
            dataStream.write({
              type: "data-appendMessage",
              data: JSON.stringify({
                id: assistantMessageId,
                role: "assistant",
                parts: [{ type: "text", text: finalText }],
              }),
              transient: true,
            });
          } catch (streamError) {
            console.error("Error processing stream:", streamError);
            throw streamError;
          }
        },
        generateId: generateUUID,
        onFinish: () => {
          if (isDevelopment) {
            console.log("Stream finished");
          }
        },
        onError: (error) => {
          console.error("Error in message stream:", error);
          return "Oops, an error occurred!";
        },
      });

      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }

    // Handle non-streaming response (backward compatibility)
    {
      if (isDevelopment) {
        console.log("Processing non-streaming response from n8n");
      }

      let n8nData: any;
      let responseText = "";
      try {
        responseText = await n8nResponse.text();
        if (isDevelopment) {
          console.log("n8n raw response:", responseText);
        }
        n8nData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse n8n response as JSON:", parseError);
        console.error(
          "Response text:",
          responseText || "No response text available"
        );
        return new ChatSDKError("offline:chat").toResponse();
      }

      if (isDevelopment) {
        console.log("n8n parsed data:", JSON.stringify(n8nData, null, 2));
      }

      // Handle n8n response format:
      // - Array format: [{ success: true, response: "...", sessionId: "...", userId: "..." }]
      // - Object with json wrapper: { json: { success: true, response: "..." } }
      // - Direct object: { success: true, response: "..." }
      let responseData: any;

      if (Array.isArray(n8nData) && n8nData.length > 0) {
        // If it's an array, take the first element
        responseData = n8nData[0];
      } else if (n8nData.json) {
        // If it has a json wrapper
        responseData = n8nData.json;
      } else {
        // Direct object format
        responseData = n8nData;
      }

      if (!responseData || !responseData.success || !responseData.response) {
        console.error("n8n returned invalid response structure:");
        console.error("responseData:", JSON.stringify(responseData, null, 2));
        console.error("Full n8nData:", JSON.stringify(n8nData, null, 2));
        return new ChatSDKError("offline:chat").toResponse();
      }

      // Extract sessionId and userId from n8n response
      const n8nSessionId = responseData.sessionId;
      const n8nUserId = responseData.userId;

      if (isDevelopment) {
        console.log("=== N8N RESPONSE IDS DEBUG ===");
        console.log("Expected Chat ID:", id);
        console.log("N8N sessionId:", n8nSessionId);
        console.log("IDs match:", id === n8nSessionId);
        console.log("Expected User ID:", currentUserId);
        console.log("N8N userId:", n8nUserId);
        console.log("User IDs match:", currentUserId === n8nUserId);
        console.log("=============================");
      }

      // Validate IDs if they exist in response
      if (n8nSessionId && n8nSessionId !== id) {
        console.warn(
          `WARNING: n8n returned different sessionId. Expected: ${id}, Got: ${n8nSessionId}`
        );
        // Continue anyway - our chat ID is authoritative
      }

      if (n8nUserId && n8nUserId !== currentUserId) {
        console.warn(
          `WARNING: n8n returned different userId. Expected: ${currentUserId}, Got: ${n8nUserId}`
        );
        // Continue anyway - our user ID is authoritative
      }

      const assistantResponse = responseData.response;
      if (isDevelopment) {
        console.log("Successfully extracted response from n8n");
      }

      // Save BOTH messages to database first
      try {
        await saveMessages({
          messages: [
            {
              id: assistantMessageId,
              role: "assistant",
              parts: [{ type: "text", text: assistantResponse }],
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            },
          ],
        });
        if (isDevelopment) {
          console.log("Assistant message saved to database");
        }
      } catch (error) {
        console.error("Error saving assistant message to database:", error);
      }

      // Create a simple stream that just sends the assistant message
      const stream = createUIMessageStream<ChatMessage>({
        execute: ({ writer: dataStream }) => {
          // Send assistant message with transient true AND no metadata
          // This should append to the existing user message
          dataStream.write({
            type: "data-appendMessage",
            data: JSON.stringify({
              id: assistantMessageId,
              role: "assistant",
              parts: [{ type: "text", text: assistantResponse }],
              // NO metadata/createdAt - this is key!
            }),
            transient: true,
          });
        },
        generateId: generateUUID,
        onFinish: () => {
          if (isDevelopment) {
            console.log("Stream finished");
          }
        },
        onError: (error) => {
          console.error("Error in message stream:", error);
          return "Oops, an error occurred!";
        },
      });

      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  // Ensure user exists in database, create guest if not
  let currentUserId = session.user.id;
  const existingUser = await getUserById(session.user.id);

  if (!existingUser) {
    // User was deleted from DB but session still has old ID
    // Create new guest user and use it
    const [newGuestUser] = await createGuestUser();
    currentUserId = newGuestUser.id;
  }

  const chat = await getChatById({ id });

  if (!chat) {
    return new ChatSDKError("not_found:chat").toResponse();
  }

  // Check if chat's owner still exists
  const chatOwner = await getUserById(chat.userId);

  if (chat.userId !== currentUserId) {
    // If chat owner exists but is different user, deny access
    if (chatOwner) {
      // Chat belongs to a different existing user, deny access
      return new ChatSDKError("forbidden:chat").toResponse();
    }
    // Chat owner doesn't exist (was deleted), allow access and update chat ownership
    // Update chat to belong to new guest user
    await updateChatUserIdById({ chatId: id, userId: currentUserId });
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
