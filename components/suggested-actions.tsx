"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";
import type { BusinessFunction } from "./business-function-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  businessFunction?: BusinessFunction;
};

const getSuggestedActions = (businessFunction?: BusinessFunction): string[] => {
  switch (businessFunction) {
    case "Sales":
      return [
        "Calculate ROI for AI automation in my Sales team",
        "What's the ROI for automating lead qualification and follow-ups?",
        "Help me assess ROI for Sales pipeline automation",
        "What's the ROI for AI-powered sales forecasting and reporting?",
      ];
    case "Marketing":
      return [
        "Calculate ROI for Marketing automation and campaign management",
        "What's the ROI for AI-powered content creation and personalization?",
        "Help me assess ROI for Marketing analytics and reporting automation",
        "What's the ROI for automating lead scoring and segmentation?",
      ];
    case "Customer Service":
      return [
        "Calculate ROI for Customer Service automation and ticket handling",
        "What's the ROI for AI chatbots and automated customer support?",
        "Help me assess ROI for Customer Service response time improvements",
        "What's the ROI for automating customer inquiry routing and resolution?",
      ];
    default:
      return [
        "I want to calculate ROI for implementing AI automation",
        "Help me assess ROI for automation initiatives in my organization",
        "What's the ROI for implementing AI in my business?",
        "Calculate ROI for automation and efficiency improvements",
      ];
  }
};

function PureSuggestedActions({ chatId, sendMessage, businessFunction }: SuggestedActionsProps) {
  const suggestedActions = useMemo(
    () => getSuggestedActions(businessFunction),
    [businessFunction]
  );

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              window.history.pushState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.businessFunction !== nextProps.businessFunction) {
      return false;
    }

    return true;
  }
);
