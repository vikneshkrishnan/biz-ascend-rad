import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getMaturityBand(radScore) {
  if (radScore >= 80) return 'Growth Engine Strong'
  if (radScore >= 65) return 'Growth System Constrained'
  if (radScore >= 50) return 'Growth System Underpowered'
  return 'Growth System At Risk'
}
