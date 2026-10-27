/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API real. Ausente: o frontend usa o backend simulado em memoria. */
  readonly VITE_API_URL?: string;
}
