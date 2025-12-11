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
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

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

    console.log("=== API CHAT POST DEBUG ===");
    console.log("Chat ID:", id);
    console.log("Message:", message);
    console.log("===========================");

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Get chat first to check if it already exists
    const chat = await getChatById({ id });

    // Ensure user exists in database, create guest if not
    let currentUserId = session.user.id;
    const existingUser = await getUserById(session.user.id);

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

    if (chat) {
      // Check if chat's owner still exists
      const chatOwner = await getUserById(chat.userId);

      if (chat.userId !== currentUserId) {
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
      const title = await generateTitleFromUserMessage({
        message,
      });

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

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Get n8n configuration from environment variables
    const n8nBaseUrl =
      process.env.N8N_BASE_URL || "https://n8n.srv838270.hstgr.cloud";
    const n8nWebhookId =
      process.env.N8N_WEBHOOK_ID || "0a7ad9c6-bec1-45ff-9c4a-0884f6725583";

    // Build webhook URL with businessFunction as path parameter
    // Format: /webhook-test/{webhookId}/{businessFunction}
    const n8nWebhookUrl = `${n8nBaseUrl}/webhook-test/${n8nWebhookId}/${businessFunction}`;

    // Prepare request body for n8n
    // Send data directly without wrapping in "body" key
    // Note: promptTemplate is NOT sent as it's already configured in n8n's system prompt
    const n8nRequestBody: {
      message: string;
      sessionId: string;
      userId: string;
      functions?: string[];
    } = {
      message: userMessageText,
      sessionId: id, // Use chat ID as session ID
      userId: currentUserId,
    };

    // Only include functions array if businessFunction is Sales, Marketing, or Customer Service
    const shouldIncludeBusinessFunction =
      businessFunction === "Sales" ||
      businessFunction === "Marketing" ||
      businessFunction === "Customer Service";

    if (shouldIncludeBusinessFunction) {
      n8nRequestBody.functions = [businessFunction];
    }

    // Call n8n webhook
    let n8nResponse: Response;
    try {
      console.log("Calling n8n webhook:", n8nWebhookUrl);
      console.log("Request body:", JSON.stringify(n8nRequestBody, null, 2));

      n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(n8nRequestBody),
      });

      console.log(
        "n8n response status:",
        n8nResponse.status,
        n8nResponse.statusText
      );

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

    // Parse n8n response
    let n8nData: any;
    let responseText = "";
    try {
      responseText = await n8nResponse.text();
      console.log("n8n raw response:", responseText);
      n8nData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse n8n response as JSON:", parseError);
      console.error(
        "Response text:",
        responseText || "No response text available"
      );
      return new ChatSDKError("offline:chat").toResponse();
    }

    console.log("n8n parsed data:", JSON.stringify(n8nData, null, 2));

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

    console.log("=== N8N RESPONSE IDS DEBUG ===");
    console.log("Expected Chat ID:", id);
    console.log("N8N sessionId:", n8nSessionId);
    console.log("IDs match:", id === n8nSessionId);
    console.log("Expected User ID:", currentUserId);
    console.log("N8N userId:", n8nUserId);
    console.log("User IDs match:", currentUserId === n8nUserId);
    console.log("=============================");

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
    console.log("Successfully extracted response from n8n");

    // Generate ID for assistant message
    const assistantMessageId = generateUUID();

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
      console.log("Assistant message saved to database");
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
        console.log("Stream finished");
      },
      onError: (error) => {
        console.error("Error in message stream:", error);
        return "Oops, an error occurred!";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
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
