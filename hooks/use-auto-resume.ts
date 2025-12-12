"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";
import { useDataStream } from "@/components/data-stream-provider";
import type { ChatMessage } from "@/lib/types";

export type UseAutoResumeParams = {
  autoResume: boolean;
  initialMessages: ChatMessage[];
  messages: ChatMessage[];
  resumeStream: UseChatHelpers<ChatMessage>["resumeStream"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  status: UseChatHelpers<ChatMessage>["status"];
};

export function useAutoResume({
  autoResume,
  initialMessages,
  messages,
  resumeStream,
  setMessages,
  status,
}: UseAutoResumeParams) {
  const { dataStream } = useDataStream();

  useEffect(() => {
    if (!autoResume) {
      return;
    }

    if (typeof resumeStream !== "function") {
      return;
    }

    // Wait for the hook to be in ready state before attempting manual resume
    // This ensures the transport is fully initialized
    if (status !== "ready") {
      return;
    }

    const mostRecentMessage = initialMessages.at(-1);

    if (mostRecentMessage?.role === "user") {
      // Add a small delay to ensure transport is ready
      const timeoutId = setTimeout(() => {
        try {
          resumeStream();
        } catch (error) {
          console.error("Error resuming stream:", error);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResume, initialMessages.at, resumeStream, status]);

  useEffect(() => {
    if (!dataStream) {
      return;
    }
    if (dataStream.length === 0) {
      return;
    }

    const dataPart = dataStream[0];

    if (dataPart.type === "data-appendMessage") {
      const message = JSON.parse(dataPart.data);
      // Check if message with this ID already exists
      const existingMessageIndex = messages.findIndex(
        (m) => m.id === message.id
      );

      if (existingMessageIndex >= 0) {
        // Update existing message instead of appending
        const updatedMessages = [...messages];
        updatedMessages[existingMessageIndex] = message;
        setMessages(updatedMessages);
      } else {
        // Only append if message doesn't exist
        setMessages([...messages, message]);
      }
    }
  }, [dataStream, messages, setMessages]);
}
