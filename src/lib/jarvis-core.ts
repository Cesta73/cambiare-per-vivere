import { supabase } from './supabase';

const jarvisCoreUrl = import.meta.env.VITE_JARVIS_CORE_URL?.replace(/\/$/, '') || '';

export interface JarvisCoreMessageResponse {
  ok: true;
  core: 'jarvis-3.0';
  interface: string;
  conversationId: string;
  eventId: string | null;
  answer: string;
  auth: 'core_api_token' | 'supabase_user_session';
}

export function isJarvisCoreConfigured() {
  return Boolean(jarvisCoreUrl);
}

export async function sendJarvisCoreMessage(text: string, conversationId: string): Promise<JarvisCoreMessageResponse> {
  if (!jarvisCoreUrl) {
    throw new Error('Jarvis Core non configurato.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Sessione non disponibile.');
  }

  const response = await fetch(`${jarvisCoreUrl}/core/message`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text,
      interface: 'cambiare-per-vivere',
      conversationId,
      receivedAt: new Date().toISOString(),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(coreErrorLabel(payload?.error, response.status));
  }

  return payload as JarvisCoreMessageResponse;
}

function coreErrorLabel(error: string | undefined, status: number) {
  if (error === 'unauthorized') return 'Accesso a Jarvis Core non autorizzato.';
  if (error === 'core_api_not_configured') return 'Jarvis Core non configurato in produzione.';
  if (error === 'missing_text') return 'Messaggio vuoto.';
  if (error === 'text_too_long') return 'Messaggio troppo lungo.';
  return `Jarvis Core non disponibile (${status}).`;
}
