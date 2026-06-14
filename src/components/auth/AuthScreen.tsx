import { useState } from 'react';
import { Eye, EyeOff, Leaf } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-amber-50 to-sage-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-700 rounded-2xl mb-4 shadow-lg">
            <Leaf size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-warm-gray-900">Cambiare per Vivere</h1>
          <p className="text-warm-gray-600 mt-2 text-sm">Il tuo percorso personale</p>
        </div>

        <div className="card">
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
              {loading ? 'Accesso...' : 'Accedi'}
            </button>
            {errorMessage && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {errorMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
