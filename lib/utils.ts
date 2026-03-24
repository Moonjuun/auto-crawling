import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// 클래스 이름 병합 유틸 (shadcn/ui 기본 유틸)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
