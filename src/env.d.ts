/// <reference types="astro/client" />

// Minimal typing for the Cloudflare Workers runtime module used by the API route.
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
