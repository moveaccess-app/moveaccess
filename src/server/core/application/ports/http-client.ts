// Application Layer - HTTP Client Port (Interface)
// Define o contrato para clientes HTTP

export interface HttpRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  timeout?: number;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface IHttpClient {
  /**
   * GET request
   */
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * POST request
   */
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * PUT request
   */
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * PATCH request
   */
  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * DELETE request
   */
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
}
