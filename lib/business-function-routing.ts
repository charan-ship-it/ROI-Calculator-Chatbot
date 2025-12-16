import type { BusinessFunction } from "@/components/business-function-selector";

/**
 * Maps business function names to URL slugs
 */
const BUSINESS_FUNCTION_TO_SLUG: Record<BusinessFunction, string> = {
  "AI Accelerate": "",
  Marketing: "marketing",
  Sales: "sales",
  "Customer Success": "customer-success",
  Operations: "operations",
  Finance: "finance",
  HR: "hr",
};

/**
 * Maps URL slugs to business function names
 */
const SLUG_TO_BUSINESS_FUNCTION: Record<string, BusinessFunction> = {
  "": "AI Accelerate",
  marketing: "Marketing",
  sales: "Sales",
  "customer-success": "Customer Success",
  operations: "Operations",
  finance: "Finance",
  hr: "HR",
};

/**
 * Converts a business function to its corresponding URL slug
 * @param businessFunction - The business function name
 * @returns The URL slug (empty string for "AI Accelerate" which maps to root)
 */
export function businessFunctionToSlug(
  businessFunction: BusinessFunction
): string {
  return BUSINESS_FUNCTION_TO_SLUG[businessFunction] ?? "";
}

/**
 * Converts a URL slug to its corresponding business function
 * @param slug - The URL slug (empty string or path segment)
 * @returns The business function name or null if invalid
 */
export function slugToBusinessFunction(slug: string): BusinessFunction | null {
  // Handle root path
  if (slug === "" || slug === "/") {
    return "AI Accelerate";
  }

  // Remove leading slash if present
  const normalizedSlug = slug.startsWith("/") ? slug.slice(1) : slug;

  return SLUG_TO_BUSINESS_FUNCTION[normalizedSlug] ?? null;
}

/**
 * Extracts business function from a pathname
 * @param pathname - The full pathname (e.g., "/marketing", "/sales", "/")
 * @returns The business function name or null if invalid
 */
export function getBusinessFunctionFromPathname(
  pathname: string
): BusinessFunction | null {
  // Remove leading slash and get first segment
  const segments = pathname.split("/").filter(Boolean);

  // If no segments, it's root (AI Accelerate)
  if (segments.length === 0) {
    return "AI Accelerate";
  }

  // Get first segment (ignore /chat/[id] paths)
  const firstSegment = segments[0];

  // If it's "chat", this is an existing chat page, return null
  // (business function should come from chat data)
  if (firstSegment === "chat") {
    return null;
  }

  return slugToBusinessFunction(firstSegment);
}
