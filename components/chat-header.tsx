"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import {
  type BusinessFunction,
  BusinessFunctionSelector,
} from "./business-function-selector";
import { PlusIcon } from "./icons";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

function PureChatHeader({
  businessFunction,
  chatId: _chatId,
  isReadonly,
  onBusinessFunctionChange,
  selectedVisibilityType: _selectedVisibilityType,
}: {
  businessFunction: BusinessFunction;
  chatId: string;
  isReadonly: boolean;
  onBusinessFunctionChange: (functionType: BusinessFunction) => void;
  selectedVisibilityType: unknown;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      {!isReadonly && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-8 p-1 md:h-fit md:p-2"
                  onClick={() => {
                    router.push("/?new=true");
                    router.refresh();
                  }}
                  type="button"
                  variant="ghost"
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="start" className="hidden md:block">
                New Chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <BusinessFunctionSelector
            className="order-1 md:order-2"
            onBusinessFunctionChange={onBusinessFunctionChange}
            selectedBusinessFunction={businessFunction}
          />
        </>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.businessFunction === nextProps.businessFunction &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
