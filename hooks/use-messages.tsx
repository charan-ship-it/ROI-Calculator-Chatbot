import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { useScrollToBottom } from "./use-scroll-to-bottom";

export function useMessages({
  messages,
  status,
}: {
  messages: ChatMessage[];
  status: UseChatHelpers<ChatMessage>["status"];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    setIsStreaming,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);
  const prevMessageCountRef = useRef(messages.length);
  const prevLastMessageRoleRef = useRef<ChatMessage["role"] | undefined>(
    messages.at(-1)?.role
  );
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
    }
  }, [status]);

  // Update streaming status whenever status changes
  // Enable auto-scroll when AI is thinking ("submitted") or responding ("streaming")
  useEffect(() => {
    const isAIActive = status === "streaming" || status === "submitted";
    setIsStreaming(isAIActive);
  }, [status, setIsStreaming]);

  // Handle scrolling for new user messages - ALWAYS scroll to show user's message
  useEffect(() => {
    const currentMessageCount = messages.length;
    const prevMessageCount = prevMessageCountRef.current;

    // Detect if a new message was added
    if (currentMessageCount > prevMessageCount) {
      const lastMessage = messages.at(-1);
      const isNewUserMessage = lastMessage?.role === "user";

      if (isNewUserMessage) {
        // Always scroll to show user's message, regardless of scroll position
        requestAnimationFrame(() => {
          scrollToBottom("instant");
        });
      }
    }

    prevMessageCountRef.current = currentMessageCount;
  }, [messages, scrollToBottom]);

  // Handle scrolling when AI starts responding or thinking
  useEffect(() => {
    const currentStatus = status;
    const prevStatus = prevStatusRef.current;
    const lastMessage = messages.at(-1);

    // Check if status changed to "streaming" (AI starts responding)
    const statusChangedToStreaming =
      currentStatus === "streaming" && prevStatus !== currentStatus;

    // Check if status changed to "submitted" (AI starts thinking)
    const statusChangedToSubmitted =
      currentStatus === "submitted" && prevStatus !== currentStatus;

    // Check if new assistant message appeared
    const currentLastRole = lastMessage?.role;
    const prevLastRole = prevLastMessageRoleRef.current;
    const newAssistantMessage =
      currentLastRole === "assistant" && prevLastRole !== "assistant";

    // Always scroll when AI starts streaming (user wants to see the response)
    // Only scroll for "submitted" (thinking) if user is at bottom
    if (
      statusChangedToStreaming ||
      newAssistantMessage ||
      (statusChangedToSubmitted && isAtBottom)
    ) {
      requestAnimationFrame(() => {
        scrollToBottom("instant");
      });
    }

    prevStatusRef.current = currentStatus;
    prevLastMessageRoleRef.current = currentLastRole;
  }, [status, messages, isAtBottom, scrollToBottom]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
