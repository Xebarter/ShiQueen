'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PasswordFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
};

export function PasswordField({
  id,
  value,
  onChange,
  placeholder = 'Password',
  autoComplete = 'current-password',
  disabled,
  required = true,
  className,
  autoFocus,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('h-11 rounded-xl pr-11 text-base md:text-sm', className)}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
