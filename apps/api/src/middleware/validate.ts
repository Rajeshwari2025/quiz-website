import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodTypeAny } from "zod";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error";

type Source = "body" | "query" | "params";

export function validate(schema: AnyZodObject | ZodTypeAny, source: Source = "body") {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      request[source] = schema.parse(request[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ApiError(
            422,
            "VALIDATION_ERROR",
            "Validation failed",
            error.flatten().fieldErrors as Record<string, string[]>,
          ),
        );
        return;
      }

      next(error);
    }
  };
}
