/**
 * Errores de aplicación y helpers para respuestas consistentes.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = "APP_ERROR",
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Ha ocurrido un error. Intentá de nuevo.";
}
