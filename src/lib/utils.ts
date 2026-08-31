import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx; shadcn/ui standard. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Edad que cumple en un año dado (a partir de fecha de nacimiento). */
export function getAgeTurning(birthDate: string, year: number): number {
  return year - new Date(birthDate).getFullYear();
}
