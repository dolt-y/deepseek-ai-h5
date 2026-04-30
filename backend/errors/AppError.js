export class AppError extends Error {
  constructor(message, status = 500, payload = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export function isAppError(error) {
  return error instanceof AppError;
}
