// Copyright (c) 2026 Aryan Rajendra Suthar. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
