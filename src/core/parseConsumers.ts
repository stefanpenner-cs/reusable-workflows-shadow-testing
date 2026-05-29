import { z } from 'zod';

const ConsumerSchema = z.object({
  repo: z.string().regex(/^[^/\s]+\/[^/\s]+$/, 'expected "owner/name"'),
  ref: z.string().min(1).default('main'),
});

const ConsumersSchema = z.array(ConsumerSchema);

export type Consumer = z.infer<typeof ConsumerSchema>;

/** Parse + validate the provider's shadow-consumers.json. Throws on bad JSON or shape. */
export function parseConsumers(json: string): Consumer[] {
  return ConsumersSchema.parse(JSON.parse(json));
}
