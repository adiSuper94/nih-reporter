import { Data } from "effect";

class ParseError extends Data.Error<{
  readonly rawInput: string;
  readonly schemaErrors: string;
  readonly cause: unknown;
}> {}

class ApiError extends Data.Error<{
  readonly status: number;
  readonly statusText: string;
  readonly isRetriable: boolean;
  readonly cause: unknown;
}> {}

export { ParseError, ApiError };
export type NihApiError = ApiError | ParseError;
