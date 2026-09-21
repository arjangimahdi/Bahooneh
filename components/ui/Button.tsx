import type { ButtonHTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const button = tv({
    base: [
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold select-none",
        "border transition duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
    ],
    variants: {
        variant: {
            primary: "border-accent bg-accent text-accent-ink shadow-sm hover:opacity-90",
            secondary: "border-line bg-surface text-ink hover:border-muted hover:bg-accent-soft/40",
            ghost: "border-transparent bg-transparent text-muted hover:bg-accent-soft/60 hover:text-ink",
        },
        size: {
            sm: "h-9 px-4 text-sm",
            md: "h-11 px-6 text-base",
            lg: "h-13 px-7 text-lg",
        },
        fullWidth: {
            true: "w-full",
        },
        loading: {
            true: "relative text-transparent",
        },
    },
    defaultVariants: {
        variant: "primary",
        size: "md",
        fullWidth: false,
        loading: false,
    },
});

const spinner = tv({
    base: "absolute inset-0 m-auto size-5 animate-spin rounded-full border-2 border-current border-t-transparent",
    variants: {
        variant: {
            primary: "text-accent-ink",
            secondary: "text-ink",
            ghost: "text-muted",
        },
    },
    defaultVariants: {
        variant: "primary",
    },
});

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> &
    VariantProps<typeof button> & {
        className?: string;
    };

export function Button({
    variant,
    size,
    fullWidth,
    loading,
    className,
    type = "button",
    disabled,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || Boolean(loading)}
            aria-busy={loading || undefined}
            className={button({ variant, size, fullWidth, loading, className })}
            {...props}
        >
            {children}
            {loading && <span aria-hidden className={spinner({ variant })} />}
        </button>
    );
}
