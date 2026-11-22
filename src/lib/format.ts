const penFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
});

/**
 * Formatea montos monetarios en Soles peruanos (`S/ 0.00`).
 */
export function formatCurrencyPEN(
  amount: number | string | null | undefined
): string {
  const numeric =
    typeof amount === "string" ? Number.parseFloat(amount) : (amount ?? 0);

  if (typeof numeric !== "number" || !Number.isFinite(numeric)) {
    return penFormatter.format(0).replace(/\u00a0/g, " ");
  }

  return penFormatter.format(numeric).replace(/\u00a0/g, " ");
}

/**
 * Formatea una fecha ISO 8601 con fecha y hora en locale `es-PE`.
 */
export function formatDateTime(
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

/**
 * Formatea una fecha ISO 8601 (solo fecha) en locale `es-PE`.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

/**
 * Obtiene hasta 2 iniciales a partir de un nombre completo.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "NF";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "NF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Convierte un nombre comercial en un slug URL-safe compatible con `^[a-z0-9-]+$`.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
