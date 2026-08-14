import { Response } from 'express';

export function success(res: Response, data: any, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function error(res: Response, message: string, status = 400, errors?: any[]) {
  return res.status(status).json({ success: false, message, errors: errors || [] });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateOrderNumber(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `AN-${yy}${mm}${dd}-${random}`;
}
