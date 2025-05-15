import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Format as +51 ### ### ###
  if (digits.length <= 9) {
    return digits
      .slice(0, 9)
      .replace(/(\d{3})(\d{3})?(\d{3})?/, (_, p1, p2, p3) => {
        let parts = ['+51'];
        if (p1) parts.push(p1);
        if (p2) parts.push(p2);
        if (p3) parts.push(p3);
        return parts.join(' ');
      });
  }
  
  // If more than 9 digits, truncate and format
  return digits
    .slice(0, 9)
    .replace(/(\d{3})(\d{3})(\d{3})/, '+51 $1 $2 $3');
}