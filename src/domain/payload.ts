import LZString from 'lz-string';
import { z } from 'zod';

/**
 * What travels in the QR code. By construction there is no field here that can hold a name,
 * a phone number or free text typed by the buyer other than their questions.
 */
export const payloadSchema = z.object({
  v: z.literal(2),
  i: z.string().max(24),
  l: z.enum(['en', 'hi']),
  c: z.enum(['nexa', 'arena', 'pod']),
  p: z.string().max(40).nullable(),
  r: z.string().max(40).nullable(),
  s: z.array(z.string().max(8)).max(2),
  b: z.string().max(8).nullable(),
  pr: z.array(z.string().max(12)).max(2),
  f: z.string().max(8).nullable(),
  km: z.number().min(0).max(10000),
  y: z.number().min(1).max(7),
  q: z.array(z.object({ q: z.string().max(140), i: z.string().max(40).nullable() })).max(12),
});
export type Payload = z.infer<typeof payloadSchema>;

export function encodePayload(p: Payload): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payloadSchema.parse(p)));
}

export function decodePayload(hash: string): { ok: true; payload: Payload } | { ok: false } {
  try {
    const raw = LZString.decompressFromEncodedURIComponent(hash.replace(/^#/, ''));
    if (!raw) return { ok: false };
    const parsed = payloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { ok: true, payload: parsed.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Ten digits, starting 6-9: the shape of an Indian mobile number. */
export const isValidPhone = (digits: string): boolean => /^[6-9]\d{9}$/.test(digits);
export const canSend = (digits: string, consent: boolean): boolean => consent && isValidPhone(digits);
export const maskPhone = (digits: string): string => `${'•'.repeat(Math.max(digits.length - 2, 0))}${digits.slice(-2)}`;
