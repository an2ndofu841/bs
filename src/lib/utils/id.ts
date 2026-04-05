import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

export function generateId(): string {
  return uuidv4();
}

export function generateShareCode(): string {
  return nanoid(10);
}
