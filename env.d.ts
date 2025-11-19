/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_INKCRE_CORE_URL: string
    readonly VITE_INKCRE_PGREST_URL: string
    readonly VITE_INKCRE_JWT_SECRET: string
    readonly VITE_DEPLOY_TO: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
