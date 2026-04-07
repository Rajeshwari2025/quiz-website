import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContext(request: Request, response: Response, next: NextFunction) {
  request.requestId = request.header("x-request-id") ?? randomUUID();
  response.setHeader("x-request-id", request.requestId);
  next();
}

