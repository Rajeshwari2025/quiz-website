import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
        requestId: request.requestId,
      },
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
      requestId: request.requestId,
    },
  });
}
