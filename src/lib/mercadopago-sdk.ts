const MERCADOPAGO_SDK_URL = "https://sdk.mercadopago.com/js/v2";

export interface MercadoPagoCardFormFieldStyle {
  fontSize?: string;
  color?: string;
  placeholderColor?: string;
  fontFamily?: string;
  fontWeight?: string;
}

export interface MercadoPagoCardFormIframeFieldConfig {
  id: string;
  placeholder?: string;
  style?: MercadoPagoCardFormFieldStyle;
}

export interface MercadoPagoCardFormInputFieldConfig {
  id: string;
  placeholder?: string;
}

export interface MercadoPagoCardFormData {
  paymentMethodId?: string;
  issuerId?: string;
  cardholderEmail?: string;
  amount?: string;
  token?: string;
  installments?: string;
  identificationNumber?: string;
  identificationType?: string;
  processingMode?: string;
  merchantAccountId?: string;
}

export interface MercadoPagoCardFormCallbacks {
  onFormMounted?: (error: unknown) => void;
  onFormUnmounted?: (error: unknown) => void;
  onSubmit?: (event: Event) => void;
  onFetching?: (resource: string) => (() => void) | void;
  onError?: (error: unknown, event?: unknown) => void;
  onCardTokenReceived?: (error: unknown, token?: unknown) => void;
  onIdentificationTypesReceived?: (error: unknown, types?: unknown) => void;
  onPaymentMethodsReceived?: (error: unknown, methods?: unknown) => void;
  onIssuersReceived?: (error: unknown, issuers?: unknown) => void;
  onInstallmentsReceived?: (error: unknown, installments?: unknown) => void;
  onValidityChange?: (error: unknown, field?: string) => void;
  onReady?: () => void;
}

export interface MercadoPagoCardFormConfig {
  amount: string;
  iframe?: boolean;
  autoMount?: boolean;
  form: {
    id: string;
    cardNumber: MercadoPagoCardFormIframeFieldConfig;
    expirationDate: MercadoPagoCardFormIframeFieldConfig;
    securityCode: MercadoPagoCardFormIframeFieldConfig;
    cardholderName: MercadoPagoCardFormInputFieldConfig;
    issuer: MercadoPagoCardFormInputFieldConfig;
    installments: MercadoPagoCardFormInputFieldConfig;
    identificationType: MercadoPagoCardFormInputFieldConfig;
    identificationNumber: MercadoPagoCardFormInputFieldConfig;
    cardholderEmail: MercadoPagoCardFormInputFieldConfig;
  };
  callbacks: MercadoPagoCardFormCallbacks;
}

export interface MercadoPagoCardFormInstance {
  getCardFormData: () => MercadoPagoCardFormData;
  createCardToken?: () => Promise<{ token?: string } | undefined>;
  unmount: () => void;
  mount?: () => void;
}

export interface MercadoPagoInstance {
  cardForm: (config: MercadoPagoCardFormConfig) => MercadoPagoCardFormInstance;
}

export interface MercadoPagoConstructor {
  new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance;
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor;
  }
}

let sdkLoadPromise: Promise<MercadoPagoConstructor> | null = null;

/**
 * Carga el SDK oficial de Mercado Pago JS v2 una sola vez (singleton).
 * Si falla por red o bloqueador, limpia la caché de la promesa para permitir reintentos.
 */
export function loadMercadoPagoSdk(): Promise<MercadoPagoConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("El SDK de Mercado Pago solo está disponible en el navegador.")
    );
  }

  if (window.MercadoPago) {
    return Promise.resolve(window.MercadoPago);
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise<MercadoPagoConstructor>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${MERCADOPAGO_SDK_URL}"]`
    );

    const handleLoad = () => {
      if (window.MercadoPago) {
        resolve(window.MercadoPago);
      } else {
        sdkLoadPromise = null;
        reject(
          new Error(
            "El script de Mercado Pago se cargó, pero no se pudo inicializar el SDK."
          )
        );
      }
    };

    const handleError = () => {
      sdkLoadPromise = null;
      reject(
        new Error(
          "No se pudo cargar el formulario seguro de Mercado Pago. Verifica tu conexión o desactiva bloqueadores de scripts."
        )
      );
    };

    if (existingScript) {
      if (window.MercadoPago) {
        resolve(window.MercadoPago);
        return;
      }
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = MERCADOPAGO_SDK_URL;
    script.async = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

interface RawMpErrorItem {
  code?: string | number;
  message?: string;
  field?: string;
  cause?: unknown;
  description?: string;
}

const MP_CODE_MESSAGES: Record<string, string> = {
  "205": "Ingresa un número de tarjeta válido.",
  E301: "El número de tarjeta ingresado no es válido.",
  "208": "Selecciona un mes de vencimiento válido.",
  "209": "Selecciona un año de vencimiento válido.",
  "325": "La fecha de vencimiento de la tarjeta no es válida.",
  "326": "El año de vencimiento de la tarjeta no es válido.",
  "224": "Ingresa el código de seguridad (CVV) de tu tarjeta.",
  E302: "Revisa el código de seguridad (CVV) de tu tarjeta.",
  "221": "Ingresa el nombre completo del titular de la tarjeta.",
  "316": "Ingresa un nombre de titular válido.",
  "212": "Selecciona un tipo de documento válido.",
  "213": "Selecciona un subtipo de documento válido.",
  "214": "Ingresa el número de documento de identidad.",
  "322": "Verifica el tipo de documento seleccionado.",
  "323": "Verifica el tipo de documento seleccionado.",
  "324": "El número de documento no es válido para el tipo seleccionado.",
  get_identification_types_failed:
    "No pudimos cargar los tipos de documento desde Mercado Pago. Intenta nuevamente.",
  get_payment_methods_failed:
    "No pudimos consultar los medios de pago disponibles. Verifica la configuración o intenta nuevamente.",
  get_card_bin_payment_methods_failed:
    "No reconocimos el número de tarjeta ingresado. Verifica los dígitos e intenta nuevamente.",
  fields_setup_failed:
    "No pudimos inicializar los campos seguros de tarjeta. Recarga o usa el pago desde tu cuenta de Mercado Pago.",
  tokenization_failed:
    "No pudimos validar los datos de tu tarjeta. Verifica el número, vencimiento, CVV y documento.",
  failed_to_create_card_token:
    "No pudimos validar los datos de tu tarjeta. Verifica el número, vencimiento, CVV y documento.",
};

function mapMessageTextToSpanish(rawText: string): string | null {
  const lower = rawText.toLowerCase();
  if (lower.includes("cardnumber") || lower.includes("card number")) {
    return "Ingresa un número de tarjeta válido.";
  }
  if (
    lower.includes("expiration") ||
    lower.includes("expiry") ||
    lower.includes("exp_month") ||
    lower.includes("exp_year")
  ) {
    return "Verifica la fecha de vencimiento de tu tarjeta (MM/AA).";
  }
  if (lower.includes("securitycode") || lower.includes("security code") || lower.includes("cvv")) {
    return "Revisa el código de seguridad (CVV) de tu tarjeta.";
  }
  if (lower.includes("cardholdername") || lower.includes("cardholder name")) {
    return "Ingresa el nombre del titular tal como aparece en la tarjeta.";
  }
  if (lower.includes("identification") || lower.includes("document")) {
    return "Ingresa un número de documento válido.";
  }
  if (lower.includes("email")) {
    return "Ingresa un correo electrónico válido.";
  }
  if (lower.includes("issuer")) {
    return "Selecciona el banco emisor de tu tarjeta.";
  }
  if (lower.includes("public_key") || lower.includes("public key")) {
    return "La clave pública de Mercado Pago no es válida. Usa el enlace alternativo de pago o contacta soporte.";
  }
  return null;
}

function extractMpErrorItems(error: unknown): RawMpErrorItem[] {
  if (!error) return [];
  if (Array.isArray(error)) {
    return error.flatMap((item) => extractMpErrorItems(item));
  }
  if (typeof error === "string") {
    return [{ message: error }];
  }
  if (typeof error === "object") {
    const obj = error as RawMpErrorItem;
    if (Array.isArray(obj.cause) && obj.cause.length > 0) {
      return [...extractMpErrorItems(obj.cause), obj];
    }
    return [obj];
  }
  return [];
}

/**
 * Traduce errores del SDK v2 de Mercado Pago `CardForm` a mensajes claros en español.
 */
export function formatMercadoPagoCardFormError(error: unknown): string {
  const items = extractMpErrorItems(error);

  for (const item of items) {
    const codeKey =
      item.code !== undefined && item.code !== null ? String(item.code) : "";
    if (codeKey && MP_CODE_MESSAGES[codeKey]) {
      return MP_CODE_MESSAGES[codeKey];
    }

    const fieldText = item.field ? mapMessageTextToSpanish(item.field) : null;
    if (fieldText) return fieldText;

    const rawText = item.description || item.message || "";
    if (rawText) {
      const mapped = mapMessageTextToSpanish(rawText);
      if (mapped) return mapped;
    }
  }

  const firstReadable = items
    .map((item) => (item.description || item.message || "").trim())
    .find((msg) => msg.length > 0);

  if (firstReadable) {
    return firstReadable;
  }

  return "Revisa los datos de tu tarjeta (número, vencimiento, CVV y documento) e intenta nuevamente.";
}
