/**
 * Client-side enhancement of the quote form: steps, per-step validation, progress,
 * sessionStorage draft (non-personal fields only) and fetch submission.
 * Server validation in /api/cotizar/ remains the source of truth.
 */
const DRAFT_KEY = 'quote-draft';
/** Only non-personal answers are kept in the draft (no name, phone, email or free text). */
const DRAFT_FIELDS = ['sector', 'services', 'area', 'city', 'neighborhood', 'urgency'] as const;

const MESSAGES: Record<string, string> = {
  sector: 'Seleccione el tipo de inmueble.',
  services: 'Seleccione al menos un servicio.',
  city: 'Indique la ciudad.',
  urgency: 'Seleccione la urgencia.',
  description: 'Cuéntenos un poco más (mínimo 10 caracteres).',
  name: 'Escriba su nombre.',
  phone: 'Escriba un teléfono válido.',
  email: 'Escriba un correo válido.',
  channel: 'Elija cómo prefiere que lo contactemos.',
  consent: 'Debe autorizar el tratamiento de datos para continuar.',
};

export function initQuoteForm(): void {
  const form = document.getElementById('quote-form') as HTMLFormElement | null;
  const alertBox = document.getElementById('form-alert');
  if (!form || !alertBox) return;

  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('.step')];
  const pills = [...form.querySelectorAll<HTMLElement>('[data-step-pill]')];
  const announcer = form.querySelector<HTMLElement>('[data-step-announcer]')!;
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  let current = 0;

  form.dataset.enhanced = '';

  const showAlert = (msg: string) => {
    alertBox.textContent = msg;
    alertBox.classList.toggle('hidden', !msg);
  };

  const setError = (name: string, msg: string) => {
    const slot = form.querySelector<HTMLElement>(`[data-error-for="${CSS.escape(name)}"]`);
    if (slot) slot.textContent = msg;
    form.querySelectorAll<HTMLElement>(`[name="${CSS.escape(name)}"]`).forEach((el) => {
      if (msg) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    });
  };

  /** Validates required fields of one step with the browser's constraint API. */
  const validateStep = (i: number): boolean => {
    const step = steps[i];
    let firstInvalid: HTMLInputElement | null = null;
    const names = new Set([...step.querySelectorAll<HTMLInputElement>('[name]')].map((el) => el.name));
    for (const name of names) {
      if (name === 'website' || name === 'policyVersion') continue;
      const fields = [...step.querySelectorAll<HTMLInputElement>(`[name="${CSS.escape(name)}"]`)];
      let ok = true;
      if (name === 'services') ok = fields.some((f) => f.checked);
      else if (fields[0]?.type === 'radio') ok = !fields[0].required || fields.some((f) => f.checked);
      else ok = fields.every((f) => f.checkValidity());
      setError(name, ok ? '' : (MESSAGES[name] ?? 'Revise este campo.'));
      if (!ok && !firstInvalid) firstInvalid = fields[0];
    }
    firstInvalid?.focus();
    return !firstInvalid;
  };

  const go = (i: number) => {
    current = i;
    steps.forEach((s, j) => s.toggleAttribute('data-active', j === i));
    pills.forEach((p, j) => {
      p.toggleAttribute('data-done', j < i);
      p.toggleAttribute('data-current', j === i);
    });
    back.classList.toggle('hidden', i === 0);
    back.classList.toggle('inline-flex', i > 0);
    const last = i === steps.length - 1;
    next.classList.toggle('hidden', last);
    next.classList.toggle('inline-flex', !last);
    submit.classList.toggle('hidden', !last);
    submit.classList.toggle('inline-flex', last);
    announcer.textContent = `Paso ${i + 1} de ${steps.length}: ${steps[i].querySelector('legend')?.textContent ?? ''}`;
  };

  next.addEventListener('click', () => {
    if (!validateStep(current)) return;
    saveDraft();
    go(current + 1);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    steps[current].querySelector<HTMLElement>('legend')?.setAttribute('tabindex', '-1');
    steps[current].querySelector<HTMLElement>('legend')?.focus({ preventScroll: true });
  });
  back.addEventListener('click', () => go(Math.max(0, current - 1)));

  // Live counter for the description.
  const desc = form.querySelector<HTMLTextAreaElement>('#description');
  const counter = form.querySelector<HTMLElement>('#desc-count');
  desc?.addEventListener('input', () => counter && (counter.textContent = `${desc.value.length} / ${desc.maxLength}`));

  // Draft: restore + save non-personal fields.
  function saveDraft() {
    const data: Record<string, string | string[]> = {};
    for (const key of DRAFT_FIELDS) {
      const values = new FormData(form!).getAll(key).filter((v): v is string => typeof v === 'string');
      data[key] = key === 'services' ? values : (values[0] ?? '');
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable */
    }
  }
  function restore(data: Record<string, string | string[]>) {
    for (const [key, value] of Object.entries(data)) {
      const els = form!.querySelectorAll<HTMLInputElement>(`[name="${CSS.escape(key)}"]`);
      els.forEach((el) => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = ([] as string[]).concat(value).includes(el.value);
        else if (typeof value === 'string' && value) el.value = value;
      });
    }
  }
  try {
    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft) restore(JSON.parse(draft));
  } catch {
    /* ignore corrupt draft */
  }
  // Prefill from links like /cotizar/?servicio=drywall-y-superboard or ?sector=retail
  const params = new URLSearchParams(location.search);
  if (params.get('servicio')) restore({ services: [params.get('servicio')!] });
  if (params.get('sector')) restore({ sector: params.get('sector')! });
  if (params.get('error') === 'limite') showAlert('Recibimos varias solicitudes seguidas. Intente de nuevo en unos minutos.');
  if (params.get('error') === 'validacion') showAlert('Revise los datos del formulario e intente de nuevo.');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert('');
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        go(i);
        return;
      }
    }
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const data = (await res.json()) as { ok: boolean; message?: string; fields?: Record<string, string> };
      if (data.ok) {
        sessionStorage.removeItem(DRAFT_KEY);
        location.assign('/cotizar/gracias/');
        return;
      }
      if (data.fields) {
        Object.entries(data.fields).forEach(([k, v]) => setError(k, v));
        const firstStep = steps.findIndex((s) => Object.keys(data.fields!).some((k) => s.querySelector(`[name="${CSS.escape(k)}"]`)));
        if (firstStep >= 0) go(firstStep);
      }
      showAlert(data.message ?? 'No pudimos enviar su solicitud.');
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
    } catch {
      showAlert('No hay conexión. Revise su internet e intente de nuevo.');
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }
  });

  go(0);
}
