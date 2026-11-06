import { PUBLIC_CF_ANALYTICS_TOKEN } from 'astro:env/client';

/** Cookie consent storage. Bump CONSENT_VERSION when the cookie policy changes to ask again. */
export const CONSENT_VERSION = '1';
const KEY = 'cookie-consent';

export interface Consent {
  version: string;
  date: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    return parsed.version === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: { analytics: boolean; marketing: boolean }): Consent {
  const consent: Consent = { version: CONSENT_VERSION, date: new Date().toISOString(), necessary: true, ...choice };
  try {
    localStorage.setItem(KEY, JSON.stringify(consent));
  } catch {
    // Storage blocked: consent applies for this page view only.
  }
  return consent;
}

/** Loads optional scripts allowed by the consent. Analytics token comes from PUBLIC_CF_ANALYTICS_TOKEN. */
export function applyConsent(consent: Consent): void {
  const token = PUBLIC_CF_ANALYTICS_TOKEN;
  if (consent.analytics && token && !document.getElementById('cf-analytics')) {
    const s = document.createElement('script');
    s.id = 'cf-analytics';
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.dataset.cfBeacon = JSON.stringify({ token });
    document.head.appendChild(s);
  }
}
