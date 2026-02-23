import { forwardRef, type InputHTMLAttributes, type ReactNode, useState } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: ReactNode;
    error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
    ({ label, error, className = '', id, value, defaultValue, ...props }, ref) => {
        const labelStr = typeof label === 'string' ? label : undefined;
        const inputId = id || labelStr?.toLowerCase().replace(/\s+/g, '-');
        const [isFocused, setIsFocused] = useState(false);
        const [hasValue, setHasValue] = useState(
            Boolean(value || defaultValue)
        );

        return (
            <div className="relative flex flex-col gap-1">
                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        value={value}
                        defaultValue={defaultValue}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            setHasValue(Boolean(e.target.value));
                            props.onBlur?.(e);
                        }}
                        onChange={(e) => {
                            setHasValue(Boolean(e.target.value));
                            props.onChange?.(e);
                        }}
                        className={`
                            w-full min-h-[52px] px-4 pt-5 pb-2
                            bg-white/[0.05] border border-white/12
                            rounded-[var(--radius-sm)] text-white text-sm
                            placeholder-transparent
                            backdrop-blur-md
                            transition-all duration-[var(--duration-fast)]
                            focus:bg-white/[0.08]
                            focus:border-[var(--accent-primary)]/50
                            focus:outline-none
                            focus:ring-2 focus:ring-[var(--accent-primary)]/15
                            focus:shadow-[0_0_20px_rgba(0,122,255,0.08)]
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${error ? 'border-[var(--accent-danger)]/60 focus:border-[var(--accent-danger)]/80 focus:ring-[var(--accent-danger)]/20' : ''}
                            ${className}
                        `}
                        placeholder={labelStr || ' '}
                        {...props}
                    />
                    {label && (
                        <label
                            htmlFor={inputId}
                            className={`
                                absolute left-4 transition-all duration-200 pointer-events-none
                                ${isFocused || hasValue
                                    ? 'top-1.5 text-[10px] font-medium text-[var(--accent-primary)]'
                                    : 'top-4 text-sm text-white/40'
                                }
                                ${error ? 'text-[var(--accent-danger)]' : ''}
                            `}
                        >
                            {label}
                        </label>
                    )}
                </div>
                {error && (
                    <span className="text-xs text-[var(--accent-danger)] ml-1">{error}</span>
                )}
            </div>
        );
    }
);

GlassInput.displayName = 'GlassInput';
