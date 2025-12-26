import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with comma separators for display in input fields
export function formatAmountInput(value: string): string {
  // Remove all non-digit characters except minus sign at the start
  const numericValue = value.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "");
  if (!numericValue || numericValue === "-") return numericValue;

  const num = parseInt(numericValue, 10);
  if (isNaN(num)) return "";

  return num.toLocaleString("ko-KR");
}

// Parse formatted amount back to number
export function parseFormattedAmount(formattedValue: string): number {
  const numericString = formattedValue.replace(/[^\d-]/g, "");
  return parseInt(numericString, 10) || 0;
}
