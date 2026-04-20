// Server-side HTTP client for the Asaas API.
//
// Receives an API key and environment at construction time.
// Exposes typed methods for each endpoint group.
// Currently supports: Customer (create, update, get).
// Ready to extend for payments, subscriptions, webhooks.

import type {
  AsaasCustomerCreateRequest,
  AsaasCustomerUpdateRequest,
  AsaasCustomerResponse,
  AsaasPaymentCreateRequest,
  AsaasPaymentResponse,
  AsaasSubscriptionCreateRequest,
  AsaasSubscriptionUpdateRequest,
  AsaasSubscriptionResponse,
  AsaasSubscriptionDeleteResponse,
  AsaasErrorResponse,
  AsaasEnvironment,
} from './types';
import { ASAAS_BASE_URLS } from './types';

// ─── Error ───────────────────────────────────────────────────────

export class AsaasApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors: AsaasErrorResponse['errors'] = [],
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

// ─── Client ──────────────────────────────────────────────────────

export class AsaasClient {
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly environment: AsaasEnvironment,
  ) {
    this.baseUrl = ASAAS_BASE_URLS[environment];
  }

  getEnvironment(): AsaasEnvironment {
    return this.environment;
  }

  // ─── Customer endpoints ──────────────────────────────────────

  async createCustomer(data: AsaasCustomerCreateRequest): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>('POST', '/v3/customers', data);
  }

  async updateCustomer(id: string, data: AsaasCustomerUpdateRequest): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>('PUT', `/v3/customers/${encodeURIComponent(id)}`, data);
  }

  async getCustomer(id: string): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>('GET', `/v3/customers/${encodeURIComponent(id)}`);
  }

  // ─── Payment endpoints ───────────────────────────────────────

  async createPayment(data: AsaasPaymentCreateRequest): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>('POST', '/v3/payments', data);
  }

  async getPayment(id: string): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>('GET', `/v3/payments/${encodeURIComponent(id)}`);
  }

  // ─── Subscription endpoints ──────────────────────────────────

  async createSubscription(data: AsaasSubscriptionCreateRequest): Promise<AsaasSubscriptionResponse> {
    return this.request<AsaasSubscriptionResponse>('POST', '/v3/subscriptions', data);
  }

  async getSubscription(id: string): Promise<AsaasSubscriptionResponse> {
    return this.request<AsaasSubscriptionResponse>('GET', `/v3/subscriptions/${encodeURIComponent(id)}`);
  }

  async updateSubscription(id: string, data: AsaasSubscriptionUpdateRequest): Promise<AsaasSubscriptionResponse> {
    return this.request<AsaasSubscriptionResponse>('PUT', `/v3/subscriptions/${encodeURIComponent(id)}`, data);
  }

  async cancelSubscription(id: string): Promise<AsaasSubscriptionDeleteResponse> {
    return this.request<AsaasSubscriptionDeleteResponse>('DELETE', `/v3/subscriptions/${encodeURIComponent(id)}`);
  }

  // ─── Internal ────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ errors: [] }))) as AsaasErrorResponse;
      const description = errorData.errors?.[0]?.description ?? `HTTP ${response.status}`;
      throw new AsaasApiError(description, response.status, errorData.errors);
    }

    return (await response.json()) as T;
  }
}
