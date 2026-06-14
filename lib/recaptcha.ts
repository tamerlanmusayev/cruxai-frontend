const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (key: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!SITE_KEY) return Promise.resolve();
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(s);
  });
  return loading;
}

/** Returns a reCAPTCHA token, or undefined if captcha is not configured. */
export async function getRecaptchaToken(
  action: string,
): Promise<string | undefined> {
  if (!SITE_KEY) return undefined;
  try {
    await loadScript();
    return await new Promise<string | undefined>((resolve) => {
      const timer = setTimeout(() => resolve(undefined), 8000); // never hang
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(SITE_KEY, { action });
          resolve(token);
        } catch {
          resolve(undefined);
        } finally {
          clearTimeout(timer);
        }
      });
    });
  } catch {
    return undefined;
  }
}
