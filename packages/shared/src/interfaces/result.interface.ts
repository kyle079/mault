export interface Response {
  success: boolean;
  message: string;
}

export interface Result<T> extends Response {
  data?: T;
}

export interface AuthResponse extends Response {
  redirect?: string;
}

/** API endpoints may omit a message; data is absent on failures. */
export type ApiResult<T = never> = Omit<Result<T>, "message"> &
  Partial<Pick<Response, "message">>;
export type DataResult<T> = Required<Pick<Result<T>, "success" | "data">>;
export interface Availability {
  available: boolean;
}
export interface RedirectUrl {
  url: string;
}
