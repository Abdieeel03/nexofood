import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import {
  signedUploadUrlResponseSchema,
  type SignedUploadUrlResponse,
  type StorageTarget,
} from "@/schemas/storage.schema";

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES_BY_TARGET: Record<
  StorageTarget,
  readonly string[]
> = {
  DISH_IMAGE: ["image/png", "image/jpeg", "image/webp"],
  TENANT_LOGO: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  TENANT_BANNER: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
};

export interface UploadImageParams {
  target: StorageTarget;
  file: File;
  tenantId?: string;
}

export async function uploadImageWithSignedUrl({
  target,
  file,
  tenantId,
}: UploadImageParams): Promise<string> {
  if (file.size <= 0) {
    throw new Error("El archivo seleccionado está vacío.");
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new Error("La imagen supera el límite permitido de 5 MB.");
  }

  const allowedTypes = ALLOWED_MIME_TYPES_BY_TARGET[target];
  if (!allowedTypes.includes(file.type)) {
    const allowedLabel =
      target === "DISH_IMAGE"
        ? "PNG, JPG o WebP"
        : "PNG, JPG, WebP o SVG";
    throw new Error(`Formato no soportado. Usa ${allowedLabel}.`);
  }

  const endpoint = tenantId
    ? `/tenants/${tenantId}/storage/signed-upload-url`
    : "/storage/onboarding/signed-upload-url";

  let signedUpload: SignedUploadUrlResponse;
  try {
    signedUpload = await apiClient.post<SignedUploadUrlResponse>(
      endpoint,
      {
        target,
        contentType: file.type,
        fileSizeBytes: file.size,
      },
      { schema: signedUploadUrlResponseSchema }
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "No se pudo preparar la subida de la imagen.")
    );
  }

  const uploadResponse = await fetch(signedUpload.signedUploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `No se pudo subir la imagen al almacenamiento (HTTP ${uploadResponse.status}).`
    );
  }

  return signedUpload.publicUrl;
}
