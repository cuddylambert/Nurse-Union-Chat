import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['production', 'development', 'test', 'local'])
    .default(process.env.NODE_ENV === 'production' ? 'production' : 'local'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  DEFAULT_UNION_CODE: z.string().default('NX'),
  LOG_LEVEL: z.string().default('info'),
  ENABLE_TELEMETRY: z
    .union([
      z.boolean(),
      z
        .string()
        .transform((value) => value === 'true')
    ])
    .default(false)
});

export const env = envSchema.parse(process.env);
