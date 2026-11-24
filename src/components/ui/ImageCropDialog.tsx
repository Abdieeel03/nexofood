"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { StorageTarget } from "@/schemas/storage.schema";

export interface AspectPreset {
  id: string;
  label: string;
  ratio: number; // width / height
  outputWidth: number;
  outputHeight: number;
}

const PRESETS_BY_TARGET: Record<StorageTarget, AspectPreset[]> = {
  DISH_IMAGE: [
    { id: "1:1", label: "1:1 Cuadrada", ratio: 1, outputWidth: 800, outputHeight: 800 },
    { id: "4:3", label: "4:3 Clásica", ratio: 4 / 3, outputWidth: 960, outputHeight: 720 },
  ],
  TENANT_LOGO: [
    { id: "1:1", label: "1:1 Logotipo", ratio: 1, outputWidth: 512, outputHeight: 512 },
  ],
  TENANT_BANNER: [
    { id: "16:5", label: "16:5 Banner", ratio: 16 / 5, outputWidth: 1440, outputHeight: 450 },
  ],
};

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  fileName?: string;
  originalMimeType?: string;
  target: StorageTarget;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (croppedFile: File) => Promise<void> | void;
}

export function ImageCropDialog({
  open,
  imageSrc,
  fileName = "imagen",
  originalMimeType = "image/webp",
  target,
  isSubmitting = false,
  onClose,
  onConfirm,
}: ImageCropDialogProps) {
  const presets = PRESETS_BY_TARGET[target];
  const [selectedPresetId, setSelectedPresetId] = useState(presets[0].id);
  const preset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId) ?? presets[0],
    [presets, selectedPresetId]
  );

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Frame size in CSS pixels
  const frameSize = useMemo(() => {
    const maxWidth = target === "TENANT_BANNER" ? 460 : 320;
    const width = maxWidth;
    const height = Math.round(width / preset.ratio);
    return { width, height };
  }, [preset.ratio, target]);

  const effectiveDimensions = useMemo(() => {
    if (!naturalSize) return { w: 1, h: 1 };
    const isQuarterTurn = rotation % 180 !== 0;
    return isQuarterTurn
      ? { w: naturalSize.h, h: naturalSize.w }
      : { w: naturalSize.w, h: naturalSize.h };
  }, [naturalSize, rotation]);

  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.max(
      frameSize.width / effectiveDimensions.w,
      frameSize.height / effectiveDimensions.h
    );
  }, [effectiveDimensions, frameSize, naturalSize]);

  const currentScale = baseScale * zoom;

  const clampOffset = useCallback(
    (nextX: number, nextY: number, nextZoom = zoom, nextRotation = rotation) => {
      if (!naturalSize) return { x: 0, y: 0 };
      const isQuarterTurn = nextRotation % 180 !== 0;
      const effW = isQuarterTurn ? naturalSize.h : naturalSize.w;
      const effH = isQuarterTurn ? naturalSize.w : naturalSize.h;
      const bScale = Math.max(frameSize.width / effW, frameSize.height / effH);
      const scale = bScale * nextZoom;
      const drawW = effW * scale;
      const drawH = effH * scale;
      const maxX = Math.max(0, (drawW - frameSize.width) / 2);
      const maxY = Math.max(0, (drawH - frameSize.height) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      };
    },
    [frameSize.height, frameSize.width, naturalSize, rotation, zoom]
  );

  const handleZoomChange = (nextZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, nextZoom));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom, rotation));
  };

  const handleRotate = () => {
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, nextRotation));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize || isSubmitting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset(clampOffset(drag.originX + dx, drag.originY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      dragStateRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !naturalSize) return;

    const canvas = document.createElement("canvas");
    canvas.width = preset.outputWidth;
    canvas.height = preset.outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const exportRatio = preset.outputWidth / frameSize.width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(
      canvas.width / 2 + offset.x * exportRatio,
      canvas.height / 2 + offset.y * exportRatio
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(currentScale * exportRatio, currentScale * exportRatio);
    ctx.drawImage(
      img,
      -naturalSize.w / 2,
      -naturalSize.h / 2,
      naturalSize.w,
      naturalSize.h
    );
    ctx.restore();

    const outputMime =
      originalMimeType === "image/png"
        ? "image/png"
        : originalMimeType === "image/jpeg"
          ? "image/jpeg"
          : "image/webp";
    const ext =
      outputMime === "image/png"
        ? "png"
        : outputMime === "image/jpeg"
          ? "jpg"
          : "webp";

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputMime, 0.9)
    );
    if (!blob) {
      setLoadError("No se pudo procesar el recorte de la imagen.");
      return;
    }

    const baseName = fileName.replace(/\.[^.]+$/, "") || "imagen";
    const croppedFile = new File([blob], `${baseName}.${ext}`, {
      type: outputMime,
    });
    await onConfirm(croppedFile);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Recortar y ajustar imagen"
      description="Arrastra la imagen para acomodarla y usa el zoom o rotación antes de subirla."
      size="md"
      closedby={isSubmitting ? "none" : "any"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={!naturalSize || Boolean(loadError) || isSubmitting}
            isLoading={isSubmitting}
          >
            Aplicar y subir
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {presets.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-on-surface-variant">
              Proporción:
            </span>
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPresetId(p.id);
                  setOffset({ x: 0, y: 0 });
                }}
                disabled={isSubmitting}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  p.id === preset.id
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: frameSize.width,
              height: frameSize.height,
            }}
            className="relative max-w-full overflow-hidden rounded-xl border-2 border-primary/60 bg-surface-container-highest select-none touch-none cursor-grab active:cursor-grabbing"
          >
            {imageSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Vista previa para recortar"
                crossOrigin="anonymous"
                draggable={false}
                onLoad={(e) => {
                  const targetImg = e.currentTarget;
                  setNaturalSize({
                    w: targetImg.naturalWidth,
                    h: targetImg.naturalHeight,
                  });
                  setLoadError(null);
                }}
                onError={() =>
                  setLoadError(
                    "No se pudo cargar la imagen para editarla. Selecciona un archivo desde tu equipo."
                  )
                }
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: naturalSize ? naturalSize.w * currentScale : "auto",
                  height: naturalSize ? naturalSize.h * currentScale : "auto",
                  maxWidth: "none",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            )}

            {/* Rule-of-thirds overlay */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>
          </div>
        </div>

        {loadError && (
          <p className="text-center text-xs font-medium text-error">
            {loadError}
          </p>
        )}

        <div className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
          <div className="flex items-center gap-3">
            <Icon name="zoom_out" size={18} className="text-on-surface-variant shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              disabled={!naturalSize || isSubmitting}
              aria-label="Zoom de la imagen"
              className="w-full accent-primary cursor-pointer"
            />
            <Icon name="zoom_in" size={18} className="text-on-surface-variant shrink-0" />
            <span className="w-11 text-right text-xs font-mono text-on-surface-variant">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                disabled={!naturalSize || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
              >
                <Icon name="rotate_right" size={15} />
                Rotar 90°
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={!naturalSize || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
              >
                <Icon name="center_focus_strong" size={15} />
                Restablecer
              </button>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              Salida: {preset.outputWidth} × {preset.outputHeight} px
            </span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
