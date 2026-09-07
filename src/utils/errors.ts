import type { ErrorRequestHandler } from 'express';

class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request body') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class NoAvailableVideoRecommendationsError extends AppError {
  constructor(
    message = 'No recommended videos with available metadata were found',
  ) {
    super(message, 404, 'NO_AVAILABLE_VIDEO_RECOMMENDATIONS');
  }
}

export class ExternalApiError extends AppError {
  constructor(message = 'External API request failed') {
    super(message, 502, 'EXTERNAL_API_ERROR');
  }
}

const isJsonParseError = (
  error: unknown,
): error is SyntaxError & { status: number; type: string } => {
  return (
    error instanceof SyntaxError &&
    'status' in error &&
    'type' in error &&
    error.status === 400 &&
    error.type === 'entity.parse.failed'
  );
};

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (isJsonParseError(error)) {
    res.status(400).json({
      error: {
        message: 'Invalid JSON request body',
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};
