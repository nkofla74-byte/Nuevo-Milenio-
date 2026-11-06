const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Escapes text and wraps every [[PENDIENTE: …]] marker in a highlighted span. Use with set:html. */
export const markPending = (text: string): string => escape(text).replace(/\[\[(PENDIENTE[^\]]*)\]\]/g, '<span class="pending">[[$1]]</span>');
