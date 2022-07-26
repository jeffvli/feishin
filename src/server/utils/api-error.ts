export class ApiError extends Error {
  message: string;
  statusCode: number;

  constructor(options: { message: string; statusCode: number }) {
    super(options.message);
    this.message = options.message;
    this.statusCode = options.statusCode;
  }

  static badRequest(message: string) {
    return new ApiError({
      message: message || 'Bad request.',
      statusCode: 400,
    });
  }

  static unauthorized(message: string) {
    return new ApiError({
      message: message || 'Unauthorized.',
      statusCode: 401,
    });
  }

  static forbidden(message: string) {
    return new ApiError({ message: message || 'Forbidden.', statusCode: 403 });
  }

  static notFound(message: string) {
    return new ApiError({ message: message || 'Not found.', statusCode: 404 });
  }

  static conflict(message: string) {
    return new ApiError({ message: message || 'Conflict.', statusCode: 409 });
  }

  static gone(message: string) {
    return new ApiError({ message: message || 'Gone.', statusCode: 410 });
  }

  static internal(message: string) {
    return new ApiError({
      message: message || 'Internal error.',
      statusCode: 500,
    });
  }
}
