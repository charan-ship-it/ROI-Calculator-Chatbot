"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { businessFunctionToSlug } from "@/lib/business-function-routing";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

export type BusinessFunction =
  | "AI Accelerate"
  | "Marketing"
  | "Sales"
  | "Customer Success"
  | "Operations"
  | "Finance"
  | "HR";

const businessFunctions: Array<{
  id: BusinessFunction;
  label: string;
  description: string;
  icon?: ReactNode;
}> = [
  {
    id: "AI Accelerate",
    label: "AI Accelerate",
    description: "General AI assistance and acceleration",
  },
  {
    id: "Marketing",
    label: "Marketing",
    description: "Marketing campaigns and strategies",
  },
  {
    id: "Sales",
    label: "Sales",
    description: "Sales-related queries and assistance",
  },
  {
    id: "Customer Success",
    label: "Customer Success",
    description: "Customer success and retention",
  },
  {
    id: "Operations",
    label: "Operations",
    description: "Operational efficiency and processes",
  },
  {
    id: "Finance",
    label: "Finance",
    description: "Financial planning and analysis",
  },
  {
    id: "HR",
    label: "HR",
    description: "Human resources and talent management",
  },
];

export function BusinessFunctionSelector({
  selectedBusinessFunction,
  onBusinessFunctionChange,
  className,
}: {
  selectedBusinessFunction: BusinessFunction;
  onBusinessFunctionChange: (functionType: BusinessFunction) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const selectedFunction = useMemo(
    () =>
      businessFunctions.find((func) => func.id === selectedBusinessFunction),
    [selectedBusinessFunction]
  );

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          className="hidden h-8 md:flex md:h-fit md:px-2"
          data-testid="business-function-selector"
          variant="outline"
        >
          {selectedFunction?.label}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {businessFunctions.map((func) => (
          <DropdownMenuItem
            className="group/item flex flex-row items-center justify-between gap-4"
            data-active={func.id === selectedBusinessFunction}
            data-testid={`business-function-selector-item-${func.id}`}
            key={func.id}
            onSelect={() => {
              const slug = businessFunctionToSlug(func.id);
              const path = slug === "" ? "/" : `/${slug}`;
              router.push(path);
              onBusinessFunctionChange(func.id);
              setOpen(false);
            }}
          >
            <div className="flex flex-col items-start gap-1">
              {func.label}
              {func.description && (
                <div className="text-muted-foreground text-xs">
                  {func.description}
                </div>
              )}
            </div>
            <div className="text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
