"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  try {
    const { text: title } = await generateText({
      model: myProvider.languageModel("title-model"),
      system: titlePrompt,
      prompt: getTextFromMessage(message),
    });

    return title;
  } catch (error) {
    // Fallback: Use first part of user message as title if AI Gateway fails
    // This happens when AI_GATEWAY_API_KEY is not set (e.g., local development)
    console.warn("Failed to generate title using AI Gateway, using fallback:", error);
    const messageText = getTextFromMessage(message);
    const fallbackTitle = messageText.slice(0, 50).trim();
    return fallbackTitle || "New Chat";
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  if (!message) {
    return;
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
