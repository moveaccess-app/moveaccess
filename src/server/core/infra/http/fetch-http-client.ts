// Infrastructure Layer - Fetch HTTP Client Implementation
// Implementação concreta do port IHttpClient usando fetch API

import { singleton } from 'tsyringe';
import type {
  IHttpClient,
  HttpRequestConfig,
  HttpResponse,
} from '@/server/core/application/ports/http-client';

@singleton()
export class FetchHttpClient implements IHttpClient {
  async get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, data, config);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', url, data, config);
  }

  async delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    // Adiciona query params se existirem
    const urlWithParams = this.buildUrlWithParams(url, config?.params);

    // Configura headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    // Configura timeout
    const controller = new AbortController();
    const timeoutId = config?.timeout
      ? setTimeout(() => controller.abort(), config.timeout)
      : undefined;

    try {
      const response = await fetch(urlWithParams, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      const responseData = await this.parseResponseData<T>(response);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      return {
        data: responseData,
        status: response.status,
        headers: responseHeaders,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config?.timeout}ms`);
      }
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private buildUrlWithParams(url: string, params?: Record<string, string | number>): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${searchParams.toString()}`;
  }

  private async parseResponseData<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return text as unknown as T;
  }
}
