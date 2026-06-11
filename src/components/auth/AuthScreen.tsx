import { useState } from 'react';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function AuthScreen() {
  const { signIn, signUp, enterDemoMode, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else if (mode === 'register') {
      showToast('Registrazione completata! Controlla la tua email.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-cream-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-600 rounded-2xl mb-4 shadow-lg">
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-warm-gray-900">Cambiare per Vivere</h1>
          <p className="text-warm-gray-500 mt-2 text-sm leading-relaxed">Il tuo percorso personale di benessere</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex bg-warm-gray-100 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}
              >
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="tuaemail@esempio.it"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-400 hover:text-warm-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || !email || !password} className="btn-primary w-full mt-2">
              {loading ? 'Caricamento...' : mode === 'login' ? 'Accedi' : 'Crea account'}
            </button>
          </form>
        </div>

        {/* Demo mode */}
        <div className="mt-4 text-center">
          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-warm-gray-200" />
            <span className="text-xs text-warm-gray-400 font-medium">oppure</span>
            <div className="flex-1 h-px bg-warm-gray-200" />
          </div>
          <button
            onClick={enterDemoMode}
            className="w-full btn-secondary"
          >
            Prova la modalità demo
          </button>
          <p className="text-xs text-warm-gray-400 mt-2">Esplora l'app con dati di esempio, senza registrarti</p>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-warm-gray-400 leading-relaxed">
          Questa applicazione è uno strumento personale di organizzazione e monitoraggio. Non sostituisce le indicazioni dei professionisti sanitari.
        </p>
      </div>
    </div>
  );
}
