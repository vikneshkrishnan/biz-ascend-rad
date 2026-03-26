import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getMaturityBand(radScore) {
  if (radScore >= 80) return 'Strong'
  if (radScore >= 60) return 'Developing'
  if (radScore >= 50) return 'Fragile'
  return 'At Risk'
}
