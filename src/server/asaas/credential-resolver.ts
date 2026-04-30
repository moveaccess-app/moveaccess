// Credential resolution abstraction for Asaas API keys.
//
// The integration never reads process.env directly for Asaas tokens.
// Instead, it calls this resolver, which today reads from env vars
// but can be swapped for a vault/secret-manager implementation later.

export interface IAsaasCredentialResolver {
  resolve(apiKeyReference: string): Promise<string>;
}

class EnvAsaasCredentialResolver implements IAsaasCredentialResolver {
  async resolve(apiKeyReference: string): Promise<string> {
    const value = process.env[apiKeyReference];
    if (!value) {
      const literalApiKey = apiKeyReference.trim();
      if (literalApiKey.startsWith('$aact_') || literalApiKey.startsWith('aact_')) {
        return literalApiKey;
      }

      throw new Error(
        `Credencial Asaas não encontrada para referência "${apiKeyReference}". ` +
        `Verifique se a variável de ambiente está configurada no servidor.`
      );
    }
    return value;
  }
}

// ─── Singleton with swap capability ──────────────────────────────

let resolverInstance: IAsaasCredentialResolver = new EnvAsaasCredentialResolver();

export function getCredentialResolver(): IAsaasCredentialResolver {
  return resolverInstance;
}

export function setCredentialResolver(resolver: IAsaasCredentialResolver): void {
  resolverInstance = resolver;
}
