import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Send, Sparkles } from 'lucide-react';
import {
  isJarvisCoreConfigured,
  sendJarvisCoreMessage,
} from '../../lib/jarvis-core';

interface JarvisCorePageProps {
  onBack: () => void;
}

interface CoreTurn {
  id: string;
  role: 'user' | 'jarvis';
  text: string;
}

export function JarvisCorePage({ onBack }: JarvisCorePageProps) {
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
      setError(err instanceof Error ? err.message : 'Jarvis Core non disponibile.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="page-intro flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-warm-gray-200 flex items-center justify-center text-warm-gray-700"
          aria-label="Indietro"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow text-sage-600">Jarvis 3.0</p>
          <h1 className="section-title leading-tight">Jarvis Core</h1>
        </div>
      </div>

      {!configured && (
        <div className="card bg-amber-50 border-amber-200 text-sm text-amber-800">
          Jarvis Core non è configurato in questa build.
        </div>
      )}

      <section className="card min-h-[24rem] flex flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {turns.length === 0 ? (
            <div className="h-full min-h-[16rem] flex flex-col items-center justify-center text-center text-warm-gray-400">
              <Sparkles size={28} className="mb-3 text-amber-500" />
              <p className="text-sm">Jarvis è in ascolto.</p>
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
