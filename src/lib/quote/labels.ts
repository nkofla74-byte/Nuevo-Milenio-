/** Human-readable labels shared by the quote form (UI) and the notification email. */
import type { CHANNELS, URGENCY } from './schema';

export const URGENCY_LABELS: Record<(typeof URGENCY)[number], string> = {
  inmediata: 'Lo antes posible',
  '1-mes': 'En el próximo mes',
  '1-3-meses': 'En 1 a 3 meses',
  planeando: 'Estoy planeando / sin fecha',
};

export const CHANNEL_LABELS: Record<(typeof CHANNELS)[number], string> = {
  correo: 'Correo electrónico',
  llamada: 'Llamada telefónica',
  whatsapp: 'WhatsApp',
};
