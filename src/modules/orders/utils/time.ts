/**
 * Utilidades de fecha, duración y conversión ISO 8601 UTC para operaciones en `es-PE`.
 */

type DurationFormatConstructor = new (
  locale?: string,
  options?: { style?: "long" | "short" | "narrow" | "digital" }
) => {
  format: (duration: {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  }) => string;
};

const relativeTimeFormatter =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat("es-PE", { numeric: "auto", style: "short" })
    : null;

function getDurationFormatter(): InstanceType<DurationFormatConstructor> | null {
  if (typeof Intl === "undefined" || !("DurationFormat" in Intl)) {
    return null;
  }
  const Ctor = (Intl as unknown as { DurationFormat?: DurationFormatConstructor })
    .DurationFormat;
  if (!Ctor) return null;
  try {
    return new Ctor("es-PE", { style: "narrow" });
  } catch {
    return null;
  }
}

/**
 * Calcula los minutos transcurridos desde una fecha ISO 8601 hasta `nowMs`.
 */
export function getElapsedMinutes(
  isoDate: string | null | undefined,
  nowMs = Date.now()
): number {
  if (!isoDate) return 0;
  const startMs = Date.parse(isoDate);
  if (Number.isNaN(startMs)) return 0;
  return Math.max(0, Math.floor((nowMs - startMs) / 60_000));
}

/**
 * Formatea una duración transcurrida usando `Intl.DurationFormat` cuando está disponible,
 * con fallback determinístico legible en español.
 */
export function formatElapsedDuration(
  isoDate: string | null | undefined,
  nowMs = Date.now()
): string {
  if (!isoDate) return "—";
  const startMs = Date.parse(isoDate);
  if (Number.isNaN(startMs)) return "—";

  const totalSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  if (totalSeconds < 60) {
    return "< 1 min";
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const formatter = getDurationFormatter();
  if (formatter) {
    return formatter.format({
      ...(days > 0 ? { days } : {}),
      ...(hours > 0 ? { hours } : {}),
      ...(minutes > 0 || (days === 0 && hours === 0) ? { minutes } : {}),
    });
  }

  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

/**
 * Formatea un timestamp relativo legible (ej. "hace 2 min", "hace 30 s").
 */
export function formatRelativeTimestamp(
  value: string | number | null | undefined,
  nowMs = Date.now()
): string {
  if (value === null || value === undefined) return "—";
  const ts = typeof value === "number" ? value : Date.parse(value);
  if (Number.isNaN(ts)) return "—";

  const diffSeconds = Math.round((ts - nowMs) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (relativeTimeFormatter) {
    if (absSeconds < 60) {
      return relativeTimeFormatter.format(diffSeconds, "second");
    }
    const diffMinutes = Math.round(diffSeconds / 60);
    if (Math.abs(diffMinutes) < 60) {
      return relativeTimeFormatter.format(diffMinutes, "minute");
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
      return relativeTimeFormatter.format(diffHours, "hour");
    }
    const diffDays = Math.round(diffHours / 24);
    return relativeTimeFormatter.format(diffDays, "day");
  }

  if (absSeconds < 60) return `hace ${absSeconds} s`;
  const mins = Math.round(absSeconds / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  return `hace ${hrs} h`;
}

/**
 * Convierte el valor local de `<input type="datetime-local">` a una cadena ISO 8601 UTC (`toISOString()`).
 */
export function localDateTimeToUtcIso(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}
