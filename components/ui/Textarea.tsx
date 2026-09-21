import { useId, type TextareaHTMLAttributes } from "react";
import type { VariantProps } from "tailwind-variants";
import { field } from "./field";

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> &
    VariantProps<typeof field> & {
        label?: string;
        hint?: string;
        error?: string;
        className?: string;
    };

export function Textarea({ label, hint, error, size, invalid, className, id, rows = 3, ...props }: TextareaProps) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const messageId = `${textareaId}-message`;
    const message = error ?? hint;
    const styles = field({ size, invalid: invalid || Boolean(error), className });

    return (
        <div className={styles.root()}>
            {label && (
                <label htmlFor={textareaId} className={styles.label()}>
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                rows={rows}
                aria-invalid={invalid || Boolean(error) || undefined}
                aria-describedby={message ? messageId : undefined}
                className={styles.control({ className: "resize-y leading-relaxed" })}
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
