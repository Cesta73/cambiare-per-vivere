import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface JarvisButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
}

export function JarvisButton({ variant = 'primary', icon: Icon, children, className = '', ...props }: JarvisButtonProps) {
  return (
    <button className={`btn-${variant} inline-flex items-center justify-center gap-2 ${className}`} {...props}>
      {Icon && <Icon size={18} strokeWidth={1.5} aria-hidden="true" />}
      {children}
    </button>
  );
}

interface JarvisCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  children: ReactNode;
}

export function JarvisCard({ as: Component = 'article', children, className = '', ...props }: JarvisCardProps) {
  return <Component className={`card ${className}`} {...props}>{children}</Component>;
}

export function JarvisInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input-field ${className}`} {...props} />;
}

export function JarvisIcon({ icon: Icon, label, size = 20 }: { icon: LucideIcon; label?: string; size?: number }) {
  return <Icon size={size} strokeWidth={1.45} aria-hidden={label ? undefined : true} aria-label={label} />;
}
