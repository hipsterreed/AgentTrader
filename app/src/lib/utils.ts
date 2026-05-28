import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn's canonical class merge helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
