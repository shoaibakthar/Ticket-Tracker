import { z } from "zod";

export const envSchema = z.object({}).passthrough();

export type ApiEnv = z.infer<typeof envSchema>;
