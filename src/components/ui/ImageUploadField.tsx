"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ImageCropDialog } from "@/components/ui/ImageCropDialog";
import {
  ALLOWED_MIME_TYPES_BY_TARGET,
  MAX_IMAGE_FILE_SIZE_BYTES,
  uploadImageWithSignedUrl,
} from "@/lib/storage-upload";
import type { StorageTarget } from "@/schemas/storage.schema";

interface ImageUploadFieldProps {
  id: string;
  label: string;
  helperText?: string;
  value: string;
  onChange: (nextUrl: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  target: StorageTarget;
  tenantId?: string;
  previewVariant?: "square" | "banner";
}

interface PendingCropState {
  src: string;
  fileName: string;
  mimeType: string;
  isObjectUrl: boolean;
}

export function ImageUploadField({
  id,
  label,
  helperText,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  target,
  tenantId,
  previewVariant = "square",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<PendingCropState | null>(null);

  const trimmedUrl = value.trim();
  const showPreview =
    trimmedUrl.length > 0 &&
    /^https?:\/\/.+/i.test(trimmedUrl) &&
    failedPreviewUrl !== trimmedUrl;

  const acceptMimeTypes = ALLOWED_MIME_TYPES_BY_TARGET[target].join(",");
  const combinedError = uploadError ?? error;

  const clearPendingCrop = () => {
    setPendingCrop((prev) => {
      if (prev?.isObjectUrl) {
        URL.revokeObjectURL(prev.src);
      }
      return null;
    });
  };

  useEffect(() => {
    return () => {
      if (pendingCrop?.isObjectUrl) {
        URL.revokeObjectURL(pendingCrop.src);
      }
    };
  }, [pendingCrop]);

  const uploadFile = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const publicUrl = await uploadImageWithSignedUrl({
        target,
        file,
        tenantId,
      });
      setFailedPreviewUrl(null);
      onChange(publicUrl);
      onBlur?.();
      clearPendingCrop();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "No se pudo subir la imagen."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (file.size <= 0) {
      setUploadError("El archivo seleccionado está vacío.");
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      setUploadError("La imagen supera el límite permitido de 5 MB.");
      return;
    }

    const allowedTypes = ALLOWED_MIME_TYPES_BY_TARGET[target];
    if (!allowedTypes.includes(file.type)) {
      const allowedLabel =
        target === "DISH_IMAGE" ? "PNG, JPG o WebP" : "PNG, JPG, WebP o SVG";
      setUploadError(`Formato no soportado. Usa ${allowedLabel}.`);
      return;
    }

    // SVG se sube directo para conservar su formato vectorial
    if (file.type === "image/svg+xml") {
      await uploadFile(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingCrop({
      src: objectUrl,
      fileName: file.name,
      mimeType: file.type,
      isObjectUrl: true,
    });
  };

  const handleEditCurrentImage = () => {
    if (!showPreview || disabled || isUploading) return;
    setUploadError(null);
    setPendingCrop({
      src: trimmedUrl,
      fileName: "imagen-ajustada.webp",
      mimeType: "image/webp",
      isObjectUrl: false,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-on-surface"
        >
          {label}
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <input
            id={id}
            ref={fileInputRef}
            type="file"
            accept={acceptMimeTypes}
            onChange={handleFileSelected}
            disabled={disabled || isUploading}
            className="sr-only"
            aria-label={`Seleccionar archivo para ${label}`}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-outline/40 bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <Icon name="progress_activity" size={14} className="animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Icon name="upload" size={14} />
                {showPreview ? "Cambiar imagen" : "Subir imagen"}
              </>
            )}
          </button>

          {showPreview && !disabled && (
            <button
              type="button"
              onClick={handleEditCurrentImage}
              disabled={isUploading}
              className="inline-flex items-center gap-1 rounded-lg border border-outline/40 bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high disabled:opacity-50 transition-colors"
              title="Recortar o ajustar imagen"
            >
              <Icon name="crop" size={14} />
              Editar / Recortar
            </button>
          )}

          {trimmedUrl.length > 0 && !disabled && (
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                onChange("");
                onBlur?.();
              }}
              disabled={isUploading}
              className="inline-flex items-center gap-1 rounded-lg border border-outline/30 px-2 py-1.5 text-xs text-on-surface-variant hover:text-error hover:border-error/40 disabled:opacity-50 transition-colors"
              title="Quitar imagen"
            >
              <Icon name="close" size={14} />
              Quitar
            </button>
          )}
        </div>
      </div>

      <div
        onClick={() => {
          if (!disabled && !isUploading && !showPreview) {
            fileInputRef.current?.click();
          }
        }}
        role={!disabled && !showPreview ? "button" : undefined}
        tabIndex={!disabled && !showPreview ? 0 : undefined}
        onKeyDown={(e) => {
          if (
            !disabled &&
            !isUploading &&
            !showPreview &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative overflow-hidden rounded-xl border border-dashed border-outline/35 bg-surface-container-low flex items-center justify-center transition-colors ${
          previewVariant === "banner" ? "h-32 w-full" : "h-32 w-full sm:w-44"
        } ${
          !disabled && !showPreview
            ? "cursor-pointer hover:border-primary/60 hover:bg-surface-container"
            : ""
        }`}
      >
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trimmedUrl}
            alt={label}
            onError={() => setFailedPreviewUrl(trimmedUrl)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-4 text-center text-on-surface-variant/75">
            <Icon name="add_photo_alternate" size={24} />
            <span className="text-xs font-medium">
              {disabled
                ? "Sin imagen"
                : "Haz clic para seleccionar una imagen"}
            </span>
          </div>
        )}
      </div>

      {combinedError ? (
        <p className="text-xs font-medium text-error">{combinedError}</p>
      ) : helperText ? (
        <p className="text-xs text-on-surface-variant">{helperText}</p>
      ) : null}

      <ImageCropDialog
        key={pendingCrop?.src ?? "closed"}
        open={Boolean(pendingCrop)}
        imageSrc={pendingCrop?.src ?? null}
        fileName={pendingCrop?.fileName}
        originalMimeType={pendingCrop?.mimeType}
        target={target}
        isSubmitting={isUploading}
        onClose={clearPendingCrop}
        onConfirm={uploadFile}
      />
    </div>
  );
}
