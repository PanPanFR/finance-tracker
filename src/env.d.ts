// Type declarations for Cloudflare Workers bindings

export interface CloudflareEnv {
  DB: D1Database;
  MASTER_PASSWORD_HASH: string;
  SESSION_SECRET: string;
  GOOGLE_API_KEY: string;
}

declare global {
  // D1 types (available globally in Cloudflare Workers runtime)
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
    dump(): Promise<ArrayBuffer>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }

  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    meta?: {
      duration?: number;
      changes?: number;
      last_row_id?: number;
      served_by?: string;
    };
    error?: string;
  }

  interface D1ExecResult {
    count: number;
    duration: number;
  }
}

export {};
