/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Можем да добавим повече променливи тук в бъдеще
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}