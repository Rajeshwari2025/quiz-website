export class ApiError extends Error {
  statusCode: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

