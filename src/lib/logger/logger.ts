/**
 * Logger terpusat Tati’e Kitchen.
 * Memudahkan pelacakan galat dan persiapan integrasi Sentry / telemetry di masa depan.
 */

export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[TK] ERROR [${context}]:`, message, error);
}

export function logWarning(context: string, message: string): void {
  console.warn(`[TK] WARN [${context}]: ${message}`);
}

export function logInfo(context: string, message: string): void {
  console.log(`[TK] INFO [${context}]: ${message}`);
}
