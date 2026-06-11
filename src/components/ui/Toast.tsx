import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up pointer-events-auto ${
            toast.type === 'success' ? 'bg-sage-700 text-white' :
            toast.type === 'error' ? 'bg-red-600 text-white' :
            'bg-petrol-700 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span className="flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
