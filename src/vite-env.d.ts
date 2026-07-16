/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_INBOX?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_CRM_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
