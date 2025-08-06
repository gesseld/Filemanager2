/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.tsx' {
  import { ReactElement } from 'react';
  const component: ReactElement;
  export default component;
}
