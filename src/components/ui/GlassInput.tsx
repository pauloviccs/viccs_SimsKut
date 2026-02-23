import { forwardRef, type InputHTMLAttributes } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-white/70"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full min-h-[44px] px-4 py-2.5
            bg-white/[0.06] border border-white/15
            rounded-[10px] text-white text-sm
            placeholder:text-white/30
            backdrop-blur-md
            transition-all duration-[150ms]
            focus:bg-white/[0.1] focus:border-[#007AFF]/60
            focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20
            disabled:opacity-40 disabled:cursor-not-allowed
            ${error ? 'border-[#FF3B30]/60 focus:border-[#FF3B30]/80 focus:ring-[#FF3B30]/20' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <span className="text-xs text-[#FF3B30] mt-0.5">{error}</span>
                )}
            </div>
        );
    }
);

GlassInput.displayName = 'GlassInput';
