import { z } from "zod";

export const storageTargetEnum = z.enum([
  "DISH_IMAGE",
  "TENANT_LOGO",
  "TENANT_BANNER",
]);
export type StorageTarget = z.infer<typeof storageTargetEnum>;

export const signedUploadUrlRequestSchema = z.object({
  target: storageTargetEnum,
  contentType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});
export type SignedUploadUrlRequest = z.infer<
  typeof signedUploadUrlRequestSchema
>;

export const signedUploadUrlResponseSchema = z.object({
  signedUploadUrl: z.string().url(),
  publicUrl: z.string().url(),
  bucket: z.string().min(1),
  path: z.string().min(1),
  token: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});
export type SignedUploadUrlResponse = z.infer<
  typeof signedUploadUrlResponseSchema
>;
