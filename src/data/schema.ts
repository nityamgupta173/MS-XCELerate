import { z } from 'zod';

export const factSchema = z
  .object({
    id: z.string().min(1),
    value: z.union([z.number(), z.string(), z.null()]),
    unit: z.string().optional(),
    cmp: z.number().optional(),
    label: z.string().min(1),
    source: z.string().min(1),
    url: z.string().url().optional(),
    doc: z.string().min(1).optional(),
    retrieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['verified', 'from-team-research', 'needs-verification']),
    kind: z.enum(['published', 'team-research', 'proposal', 'assumption']),
    asOf: z.string().optional(),
    note: z.string().optional(),
    verifiedAbsent: z.boolean().optional(),
  })
  .refine((f) => Boolean(f.url) || Boolean(f.doc), { message: 'fact needs a url or a doc' })
  .refine((f) => f.value !== null || f.status === 'needs-verification', { message: 'a null value must be marked needs-verification' });
export type Fact = z.infer<typeof factSchema>;

const ref = z.string().nullable();
export const fuelSchema = z.enum(['petrol', 'cng', 'hybrid', 'ev', 'diesel']);
export type Fuel = z.infer<typeof fuelSchema>;
export const variantSchema = z.object({
  id: z.string(),
  name: z.string(),
  fuel: fuelSchema,
  transmission: z.string(),
  drive: z.enum(['FWD', 'AWD', '4WD']),
  auto: z.boolean(),
  role: z.string(),
  facts: z.object({ price: z.string(), powertrain: z.string(), power: ref, torque: ref, efficiency: ref, adas: ref, boot: ref, range: ref }),
});
export type Variant = z.infer<typeof variantSchema>;
export const channelSchema = z.enum(['nexa', 'arena']);
export const modelSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  channel: channelSchema.nullable(),
  segment: z.string(),
  silhouette: z.enum(['compact', 'midsize', 'offroader']),
  seats: z.number(),
  tags: z.array(z.string()),
  resaleEvidence: z.boolean(),
  facts: z.object({ builtAt: ref, airbags: ref, crash: ref, boot: ref, groundClearance: ref, warranty: ref }),
  variants: z.array(variantSchema).min(1),
});
export type Model = z.infer<typeof modelSchema>;
export const rivalsFileSchema = z.object({
  shortlist: z.object({ nexa: z.array(z.string()), arena: z.array(z.string()), pod: z.array(z.string()) }),
  mpvs: z.array(z.object({ id: z.string(), name: z.string(), channel: channelSchema, seats: z.string() })),
  models: z.array(modelSchema),
});

export const qaIntentSchema = z.object({
  id: z.string(),
  topic: z.string(),
  models: z.array(z.string()).optional(),
  rivals: z.array(z.string()).optional(),
  route: z.enum(['answer', 'expert']).default('answer'),
  chip: z.boolean().optional(),
  checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  q: z.object({ en: z.array(z.string()).min(5), hi: z.array(z.string()).min(5) }),
  a: z.object({ en: z.string().min(1), hi: z.string().min(1) }),
});
export type QaIntent = z.infer<typeof qaIntentSchema>;
export const copySchema = z.record(z.string(), z.string());
