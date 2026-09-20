import { useId, type InputHTMLAttributes } from "react";
import type { VariantProps } from "tailwind-variants";
import { field } from "./field";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> &
    VariantProps<typeof field> & {
        label?: string;
        hint?: string;
        error?: string;
        className?: string;
    };

export function Input({ label, hint, error, size, invalid, className, id, ...props }: InputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const message = error ?? hint;
    const styles = field({ size, invalid: invalid || Boolean(error), className });

    return (
        <div className={styles.root()}>
            {label && (
                <label htmlFor={inputId} className={styles.label()}>
                    {label}
                </label>
            )}
            <input
                id={inputId}
                aria-invalid={invalid || Boolean(error) || undefined}
                aria-describedby={message ? messageId : undefined}
                className={styles.control()}
                {...props}
            />
            {message && (
                <p id={messageId} className={styles.message()}>
                    {message}
                </p>
            )}
        </div>
    );
}
