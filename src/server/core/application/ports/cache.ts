// Application Layer - Cache Port (Interface)
// Define o contrato para serviços de cache
// Implementações concretas ficam na camada de infraestrutura

export interface ICache {
  /**
   * Busca valor do cache pela chave
   * @returns Valor armazenado ou null se não encontrado/expirado
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Armazena valor no cache
   * @param key Chave única para o valor
   * @param value Valor a ser armazenado (deve ser serializável)
   * @param ttlSeconds Tempo de vida em segundos (opcional, padrão varia por implementação)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Remove valor do cache
   */
  delete(key: string): Promise<void>;

  /**
   * Limpa todo o cache
   */
  clear(): Promise<void>;

  /**
   * Verifica se chave existe no cache
   */
  has(key: string): Promise<boolean>;
}
