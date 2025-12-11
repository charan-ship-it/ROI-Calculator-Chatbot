"use client";

import { memo } from "react";
import {
  type BusinessFunction,
  BusinessFunctionSelector,
} from "./business-function-selector";
import { SidebarToggle } from "./sidebar-toggle";

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
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />
      {!isReadonly && (
        <BusinessFunctionSelector
          className="order-1 md:order-2"
          onBusinessFunctionChange={onBusinessFunctionChange}
          selectedBusinessFunction={businessFunction}
        />
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
