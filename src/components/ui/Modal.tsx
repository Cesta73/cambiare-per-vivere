import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full ${sizeClass} max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-cream-50 shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-gray-200 sticky top-0 bg-cream-50 z-10 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-warm-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-warm-gray-100 text-warm-gray-500 transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
