import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import {
  isJarvisCoreConfigured,
  sendJarvisCoreMessage,
} from '../../lib/jarvis-core';
import { BrandMark } from '../brand/BrandMark';

interface JarvisCorePageProps {
  onBack?: () => void;
  embedded?: boolean;
}

interface CoreTurn {
  id: string;
  role: 'user' | 'jarvis';
  text: string;
}

export function JarvisCorePage({ onBack, embedded = false }: JarvisCorePageProps) {
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<CoreTurn[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useMemo(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `app-${crypto.randomUUID()}`;
    }
    return `app-${Date.now()}`;
  }, []);
  const configured = isJarvisCoreConfigured();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || isSending) return;

    setText('');
    setError(null);
    setIsSending(true);
    setTurns((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: 'user', text: message },
    ]);

    try {
      const response = await sendJarvisCoreMessage(message, conversationId);
      setTurns((current) => [
        ...current,
        { id: `${Date.now()}-jarvis`, role: 'jarvis', text: response.answer },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Jarvis non disponibile.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={embedded ? 'jarvis-home-conversation' : 'space-y-4 pb-4'}>
      {!embedded && <div className="page-intro flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-warm-gray-200 flex items-center justify-center text-warm-gray-700"
          aria-label="Indietro"
        >
          <ArrowLeft size={20} />
        </button>
        <BrandMark className="w-11 h-11 flex-shrink-0" title="Jarvis" />
        <div>
          <p className="eyebrow text-sage-600">Presenza</p>
          <h1 className="section-title leading-tight">JARVIS</h1>
        </div>
      </div>}

      {!configured && (
        <div className="card bg-amber-50 border-amber-200 text-sm text-amber-800">
          Jarvis non è configurato in questa build.
        </div>
      )}

      <section className={`card flex flex-col ${embedded ? 'min-h-[18rem]' : 'min-h-[24rem]'}`}>
        {embedded && <div className="mb-4"><p className="eyebrow text-sage-700">Conversazione</p><h2 className="text-xl font-semibold text-petrol-950 mt-1">Parla con Jarvis</h2><p className="text-xs text-warm-gray-500 mt-1">La stessa conversazione, sul Web e su Telegram.</p></div>}
        <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {turns.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-center text-warm-gray-400 ${embedded ? 'min-h-[8rem]' : 'min-h-[16rem]'}`}>
              <BrandMark className="w-12 h-12 mb-3" title="Jarvis" />
              <p className="text-sm">Sono qui. Di cosa ci occupiamo?</p>
            </div>
          ) : (
            turns.map((turn) => (
              <div
                key={turn.id}
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  turn.role === 'user'
                    ? 'bg-petrol-900 text-cream-50 ml-8'
                    : 'bg-sage-50 text-warm-gray-800 border border-sage-100 mr-8'
                }`}
              >
                {turn.text}
              </div>
            ))
          )}
          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm bg-red-50 border border-red-100 text-red-700">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            disabled={!configured || isSending}
            className="flex-1 resize-none rounded-2xl border border-warm-gray-200 bg-white px-4 py-3 text-sm text-warm-gray-800 outline-none focus:ring-2 focus:ring-sage-300 disabled:bg-warm-gray-50"
            placeholder="Scrivi a Jarvis"
          />
          <button
            type="submit"
            disabled={!configured || !text.trim() || isSending}
            className="w-12 rounded-2xl bg-petrol-900 text-cream-50 flex items-center justify-center disabled:opacity-40"
            aria-label="Invia"
          >
            {isSending ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}
          </button>
        </form>
      </section>
    </div>
  );
}
