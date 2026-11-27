export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "soporte@nexofood-app.com";

export type ErrorContext = "general" | "store" | "saas" | "superadmin";

export type FriendlyErrorKind =
  | "store_not_found"
  | "not_found"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "rate_limit"
  | "timeout"
  | "service_unavailable"
  | "network"
  | "unknown";

export interface FriendlyErrorDescriptor {
  kind: FriendlyErrorKind;
  title: string;
  description: string;
  guidance: string;
  icon: string;
  tone: "neutral" | "warning" | "danger";
  canRetry: boolean;
  primaryAction: "home" | "login" | "retry";
  showSupportContact: boolean;
}

interface ErrorWithStatusLike {
  name?: unknown;
  status?: unknown;
  statusCode?: unknown;
  message?: unknown;
  retryAfter?: unknown;
}

const TECHNICAL_MESSAGE_PATTERNS: RegExp[] = [
  /^request failed with status code \d+/i,
  /^network error$/i,
  /^timeout of \d+ms exceeded/i,
  /\b(ECONNREFUSED|ECONNRESET|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|ERR_NETWORK|ERR_BAD_REQUEST|ERR_BAD_RESPONSE|ERR_FR_TOO_MANY_REDIRECTS)\b/i,
  /^error de validación del esquema:/i,
  /^an error occurred in the server components render/i,
  /^fetch failed/i,
  /\b(unexpected token|json\.parse|syntaxerror|typeerror|referenceerror|nullpointerexception|sqlstate|jdbc)\b/i,
  /^api error:\s*\d+/i,
];

export function isTechnicalErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function extractErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as ErrorWithStatusLike;

  if (typeof candidate.status === "number" && Number.isFinite(candidate.status)) {
    return candidate.status;
  }
  if (
    typeof candidate.statusCode === "number" &&
    Number.isFinite(candidate.statusCode)
  ) {
    return candidate.statusCode;
  }

  if (typeof candidate.message === "string") {
    const axiosMatch = candidate.message.match(/status code (\d{3})/i);
    if (axiosMatch) {
      return Number.parseInt(axiosMatch[1], 10);
    }
    if (
      /network error|fetch failed|ECONNREFUSED|ENOTFOUND|ECONNRESET/i.test(
        candidate.message
      )
    ) {
      return 0;
    }
    if (/timeout|ETIMEDOUT/i.test(candidate.message)) {
      return 504;
    }
  }

  return undefined;
}

export function resolveFriendlyError(options: {
  status?: number;
  error?: unknown;
  context?: ErrorContext;
  variant?: "not_found" | "store_not_found";
} = {}): FriendlyErrorDescriptor {
  const { error, context = "general", variant } = options;

  if (variant === "store_not_found") {
    return {
      kind: "store_not_found",
      title: "No encontramos este restaurante",
      description:
        "El enlace que abriste no corresponde a un restaurante disponible en NexoFood o puede estar mal escrito.",
      guidance:
        "Verifica la dirección web directamente con el restaurante o regresa al inicio.",
      icon: "store_mall_directory",
      tone: "neutral",
      canRetry: false,
      primaryAction: "home",
      showSupportContact: false,
    };
  }

  if (variant === "not_found") {
    return {
      kind: "not_found",
      title: "Esta página no está disponible",
      description:
        "El enlace al que intentaste entrar no existe, cambió de dirección o está incompleto.",
      guidance:
        "Revisa que la dirección esté bien escrita o vuelve al inicio para continuar.",
      icon: "explore_off",
      tone: "neutral",
      canRetry: false,
      primaryAction: "home",
      showSupportContact: false,
    };
  }

  const resolvedStatus = options.status ?? extractErrorStatus(error);

  if (resolvedStatus === 404) {
    return resolveFriendlyError({
      variant: context === "store" ? "store_not_found" : "not_found",
    });
  }

  if (resolvedStatus === 400 || resolvedStatus === 422) {
    return {
      kind: "bad_request",
      title: "Hubo un problema con tu solicitud",
      description:
        "No pudimos procesar la información enviada o el enlace tiene un formato incorrecto.",
      guidance:
        "Revisa los datos o la dirección e inténtalo nuevamente. Si el problema continúa, contáctanos por correo.",
      icon: "report_problem",
      tone: "warning",
      canRetry: true,
      primaryAction: "retry",
      showSupportContact: true,
    };
  }

  if (resolvedStatus === 401) {
    return {
      kind: "unauthorized",
      title: "Tu sesión ha caducado",
      description:
        "Por tu seguridad, cerramos tu sesión después de un tiempo sin actividad.",
      guidance: "Vuelve a iniciar sesión para continuar usando NexoFood.",
      icon: "lock_clock",
      tone: "warning",
      canRetry: false,
      primaryAction: "login",
      showSupportContact: false,
    };
  }

  if (resolvedStatus === 403) {
    return {
      kind: "forbidden",
      title: "No tienes acceso a esta sección",
      description:
        "Tu cuenta actual no tiene permisos suficientes para ver este contenido.",
      guidance:
        "Si crees que deberías tener acceso, consulta con el administrador de tu restaurante o escríbenos por correo.",
      icon: "gpp_maybe",
      tone: "warning",
      canRetry: false,
      primaryAction: "home",
      showSupportContact: true,
    };
  }

  if (resolvedStatus === 409) {
    return {
      kind: "conflict",
      title: "No pudimos completar esta acción ahora",
      description:
        "La información cambió hace un momento o ya existe una operación similar en curso.",
      guidance:
        "Actualiza la página para ver los datos más recientes y vuelve a intentarlo.",
      icon: "sync_problem",
      tone: "warning",
      canRetry: true,
      primaryAction: "retry",
      showSupportContact: false,
    };
  }

  if (resolvedStatus === 429) {
    return {
      kind: "rate_limit",
      title: "Demasiados intentos en poco tiempo",
      description:
        "Por seguridad, pausamos temporalmente las solicitudes desde tu dispositivo.",
      guidance:
        "Por favor espera un minuto antes de volver a intentarlo.",
      icon: "hourglass_top",
      tone: "warning",
      canRetry: true,
      primaryAction: "retry",
      showSupportContact: false,
    };
  }

  if (resolvedStatus === 408 || resolvedStatus === 504) {
    return {
      kind: "timeout",
      title: "La respuesta está tardando demasiado",
      description:
        "Nuestro servicio demoró más de lo esperado en responder a tu solicitud.",
      guidance:
        "Por favor espera unos momentos e inténtalo de nuevo. Si el problema sigue, escríbenos por correo.",
      icon: "schedule",
      tone: "warning",
      canRetry: true,
      primaryAction: "retry",
      showSupportContact: true,
    };
  }

  if (resolvedStatus === 0) {
    return {
      kind: "network",
      title: "No pudimos conectarnos con el servicio",
      description:
        "Parece que hay una interrupción en tu conexión o que el servicio está momentáneamente inaccesible.",
      guidance:
        "Verifica tu conexión a internet o espera unos minutos mientras se restablece el servicio. Si persiste, contáctanos por correo.",
      icon: "cloud_off",
      tone: "danger",
      canRetry: true,
      primaryAction: "retry",
      showSupportContact: true,
    };
  }

  if (typeof resolvedStatus === "number" && resolvedStatus >= 500) {
    return {
      kind: "service_unavailable",
      title: "El servicio no está disponible en este momento",
      description:
        "Estamos experimentando un inconveniente temporal en la plataforma y ya trabajamos para resolverlo.",
      guidance:
        "Por favor espera unos minutos y vuelve a intentarlo, o contáctanos por correo si necesitas ayuda urgente.",
      icon: "build_circle",
      tone: "danger",
      canRetry: true,
      primaryAction: "retry",
      showSupportContact: true,
    };
  }

  return {
    kind: "unknown",
    title: "Algo no salió como esperábamos",
    description:
      "Ocurrió un inconveniente inesperado al cargar esta sección.",
    guidance:
      "Por favor espera un momento e inténtalo nuevamente. Si el problema continúa, contáctanos por correo.",
    icon: "support_agent",
    tone: "danger",
    canRetry: true,
    primaryAction: "retry",
    showSupportContact: true,
  };
}

/**
 * Convierte cualquier error técnico o de API en un mensaje claro para el usuario final,
 * preservando mensajes de negocio legibles en errores 4xx y ocultando detalles internos en 5xx/red.
 */
export function formatFriendlyApiMessage(
  error: unknown,
  fallback = "Ocurrió un inconveniente inesperado. Por favor inténtalo nuevamente."
): string {
  const status = extractErrorStatus(error);
  const candidate =
    error && typeof error === "object" ? (error as ErrorWithStatusLike) : null;
  const rawMessage =
    candidate && typeof candidate.message === "string"
      ? candidate.message.trim()
      : "";

  if (status === 0) {
    return "No pudimos conectarnos con el servicio. Verifica tu conexión a internet o espera unos minutos e inténtalo de nuevo.";
  }

  if (status === 408 || status === 504) {
    return "La solicitud tardó más de lo esperado. Por favor espera unos momentos e inténtalo de nuevo.";
  }

  if (status === 429) {
    if (
      typeof candidate?.retryAfter === "number" &&
      Number.isFinite(candidate.retryAfter) &&
      candidate.retryAfter > 0
    ) {
      return `Realizaste demasiados intentos seguidos. Por favor espera ${candidate.retryAfter} segundos antes de volver a intentarlo.`;
    }
    return rawMessage && !isTechnicalErrorMessage(rawMessage)
      ? rawMessage
      : "Realizaste demasiados intentos seguidos. Por favor espera un momento antes de volver a intentarlo.";
  }

  if (typeof status === "number" && status >= 500) {
    return `Estamos presentando un problema temporal con el servicio. Por favor espera unos minutos e inténtalo de nuevo, o escríbenos a ${SUPPORT_EMAIL}.`;
  }

  if (rawMessage && !isTechnicalErrorMessage(rawMessage)) {
    return rawMessage;
  }

  if (status === 400 || status === 422) {
    return `Hubo un problema con tu solicitud. Revisa los datos ingresados e inténtalo nuevamente, o contáctanos a ${SUPPORT_EMAIL}.`;
  }

  if (status === 401) {
    return "Tu sesión expiró. Vuelve a iniciar sesión para continuar.";
  }

  if (status === 403) {
    return "No tienes permisos para realizar esta acción.";
  }

  if (status === 404) {
    return "No encontramos la información solicitada.";
  }

  return fallback;
}
