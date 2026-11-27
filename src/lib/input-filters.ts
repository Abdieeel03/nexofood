import type { ClipboardEvent, KeyboardEvent } from "react";
import type { ChangeHandler, UseFormRegisterReturn } from "react-hook-form";

export interface IntegerFilterOptions {
  allowNegative?: boolean;
  maxLength?: number;
}

export interface DecimalFilterOptions {
  allowNegative?: boolean;
  maxLength?: number;
}

/**
 * Filtra una cadena dejando únicamente dígitos 0-9 (y opcionalmente '-' al inicio).
 */
export function filterIntegerInput(
  raw: string,
  options: IntegerFilterOptions = {}
): string {
  const { allowNegative = false, maxLength } = options;
  let result = "";
  let hasMinus = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (allowNegative && ch === "-" && result.length === 0 && !hasMinus) {
      result += ch;
      hasMinus = true;
    } else if (ch >= "0" && ch <= "9") {
      result += ch;
    }
  }

  if (typeof maxLength === "number" && maxLength > 0) {
    result = result.slice(0, maxLength);
  }
  return result;
}

/**
 * Filtra una cadena dejando dígitos 0-9, un único punto decimal '.'
 * (y opcionalmente '-' al inicio). Bloquea 'e', 'E', '+', espacios y letras.
 */
export function filterDecimalInput(
  raw: string,
  options: DecimalFilterOptions = {}
): string {
  const { allowNegative = false, maxLength } = options;
  let result = "";
  let hasDot = false;
  let hasMinus = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (allowNegative && ch === "-" && result.length === 0 && !hasMinus) {
      result += ch;
      hasMinus = true;
    } else if (ch >= "0" && ch <= "9") {
      result += ch;
    } else if (ch === "." && !hasDot) {
      result += result === "" || result === "-" ? "0." : ".";
      hasDot = true;
    }
  }

  if (typeof maxLength === "number" && maxLength > 0) {
    result = result.slice(0, maxLength);
  }
  return result;
}

/**
 * Filtra un slug de storefront: solo minúsculas a-z, dígitos 0-9 y guiones '-'.
 */
export function filterSlugInput(raw: string, maxLength = 100): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, maxLength);
}

/**
 * Filtra nombres propios de personas: permite letras Unicode (incluyendo tildes y ñ),
 * espacios, apóstrofes y guiones; bloquea dígitos y símbolos especiales.
 */
export function filterPersonNameInput(raw: string, maxLength = 150): string {
  return raw.replace(/[^\p{L}\s'-]/gu, "").slice(0, maxLength);
}

/**
 * Bloquea teclas no válidas en inputs numéricos antes de que se pinten.
 */
export function handleNumericKeyDown(
  e: KeyboardEvent<HTMLInputElement>,
  options: { allowDecimal?: boolean; allowNegative?: boolean } = {}
): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const allowedControlKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];
  if (allowedControlKeys.includes(e.key)) return;

  if (e.key >= "0" && e.key <= "9") return;

  if (options.allowDecimal && e.key === ".") {
    if (!e.currentTarget.value.includes(".")) return;
  }

  if (options.allowNegative && e.key === "-") {
    const { selectionStart, value } = e.currentTarget;
    if (selectionStart === 0 && !value.includes("-")) return;
  }

  e.preventDefault();
}

/**
 * Sanitiza texto pegado en inputs numéricos/filtrados.
 */
export function sanitizePaste(
  e: ClipboardEvent<HTMLInputElement>,
  filterFn: (val: string) => string
): void {
  const pasted = e.clipboardData.getData("text");
  const filtered = filterFn(pasted);
  if (filtered !== pasted) {
    e.preventDefault();
    const input = e.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const nextValue = filterFn(
      input.value.slice(0, start) + filtered + input.value.slice(end)
    );
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeSetter?.call(input, nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/**
 * Envuelve `register(...)` de React Hook Form para filtrar `e.target.value`
 * antes de que RHF lea y sincronice el valor en su estado interno.
 */
export function withInputFilter<TFieldName extends string>(
  registration: UseFormRegisterReturn<TFieldName>,
  filterFn: (value: string) => string
): UseFormRegisterReturn<TFieldName> {
  const onChange: ChangeHandler = (e) => {
    const target = e.target as HTMLInputElement | null;
    if (target && typeof target.value === "string") {
      const filtered = filterFn(target.value);
      if (target.value !== filtered) {
        target.value = filtered;
      }
    }
    return registration.onChange(e);
  };

  return {
    ...registration,
    onChange,
  };
}

const RUC_VALID_PREFIXES = new Set(["10", "15", "17", "20"]);
const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export interface RucValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Valida un RUC peruano (SUNAT): 11 dígitos, prefijo válido (10, 15, 17 o 20)
 * y dígito verificador módulo 11.
 */
export function validatePeruRuc(ruc: string): RucValidationResult {
  const trimmed = ruc.trim();
  if (!/^\d{11}$/.test(trimmed)) {
    return {
      isValid: false,
      reason: "El RUC debe tener exactamente 11 dígitos numéricos.",
    };
  }

  const prefix = trimmed.slice(0, 2);
  if (!RUC_VALID_PREFIXES.has(prefix)) {
    return {
      isValid: false,
      reason: "El RUC debe iniciar con 10, 15, 17 o 20.",
    };
  }

  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(trimmed[i]) * RUC_WEIGHTS[i];
  }
  const expectedCheckDigit = (11 - (sum % 11)) % 10;
  const actualCheckDigit = Number(trimmed[10]);

  if (expectedCheckDigit !== actualCheckDigit) {
    return {
      isValid: false,
      reason: "El RUC ingresado no es válido (dígito verificador incorrecto).",
    };
  }

  return { isValid: true };
}
