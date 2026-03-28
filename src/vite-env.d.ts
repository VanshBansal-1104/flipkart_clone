/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin for split deploy, e.g. https://api-xyz.onrender.com — omit for same-origin */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
