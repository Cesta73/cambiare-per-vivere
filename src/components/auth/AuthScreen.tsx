import { useState } from 'react';
import { Compass, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function AuthScreen() {
  const { signIn, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setErrorMessage('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      const message = error === 'Invalid login credentials'
        ? 'Email o password non corretti. Controlla di non aver inserito spazi.'
        : error;
      setErrorMessage(message);
      showToast(message, 'error');
    }
  };

  return (
    <div className="min-h-screen auth-backdrop flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-7">
          <div className="brand-seal mx-auto mb-5">
            <img src="/jarvis-emblem.png" alt="Emblema di Cambiare per Vivere" className="w-full h-full rounded-full" />
          </div>
          <p className="eyebrow text-amber-300 mb-2">Il tuo spazio di orientamento</p>
          <h1 className="font-display text-4xl text-cream-50 tracking-tight">Cambiare per Vivere</h1>
          <p className="text-sage-200 mt-2 text-sm">Presenza, direzione, passi concreti.</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-500 p-1"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || !email || !password} className="btn-primary w-full">
              {loading ? 'Accesso...' : 'Entra nel tuo spazio'}
            </button>
            {errorMessage && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {errorMessage}
              </p>
            )}
          </form>
          <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs text-sage-200">
            <div className="flex items-center gap-2"><Compass size={15} className="text-amber-300" /> Direzione quotidiana</div>
            <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-amber-300" /> Dati personali</div>
          </div>
        </div>
      </div>
    </div>
  );
}
