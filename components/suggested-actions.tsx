"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import type { ChatMessage } from "@/lib/types";
import type { BusinessFunction } from "./business-function-selector";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

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
        "I would like to get a ROI and Savings for my Company with Al",
        "What's the ROI for automating lead scoring and segmentation?",
      ];
    case "Customer Success":
      return [
        "Calculate ROI for Customer Success automation and retention initiatives",
        "What's the ROI for AI-powered customer health scoring and churn prediction?",
        "Help me assess ROI for automating customer onboarding and success workflows",
        "What's the ROI for customer engagement and expansion automation?",
      ];
    case "Operations":
      return [
        "Calculate ROI for Operations automation and process optimization",
        "What's the ROI for AI-powered supply chain and logistics automation?",
        "Help me assess ROI for automating operational workflows and task management",
        "What's the ROI for operational analytics and reporting automation?",
      ];
    case "Finance":
      return [
        "Calculate ROI for Finance automation and financial process optimization",
        "What's the ROI for AI-powered financial analysis and forecasting?",
        "Help me assess ROI for automating accounting, invoicing, and reconciliation",
        "What's the ROI for financial reporting and compliance automation?",
      ];
    case "HR":
      return [
        "Calculate ROI for HR automation and talent management optimization",
        "What's the ROI for AI-powered recruitment and candidate screening?",
        "Help me assess ROI for automating onboarding, training, and performance management",
        "What's the ROI for HR analytics and workforce planning automation?",
      ];
    default:
      return [
        "I want to calculate ROI for implementing AI automation",
        "I would like to get a ROI and Savings for my Company with Al",
        "What's the ROI for implementing AI in my business?",
        "Calculate ROI for automation and efficiency improvements",
      ];
  }
};

function PureSuggestedActions({
  chatId,
  sendMessage,
  businessFunction,
}: SuggestedActionsProps) {
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
              // Don't update URL here - let it happen after message is sent
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
