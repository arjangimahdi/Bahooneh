import type { ButtonHTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const chip = tv({
    base: [
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium select-none",
        "border transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
    ],
    variants: {
        variant: {
            primary: "border-line bg-surface text-ink hover:border-muted hover:bg-accent-soft/40",
            secondary: "border-transparent bg-transparent text-muted hover:bg-accent-soft/60 hover:text-ink",
        },
        size: {
            sm: "h-8 px-3 text-sm",
            md: "h-10 px-4 text-sm",
        },
        selected: {
            true: "",
        },
    },
    compoundVariants: [
        {
            variant: ["secondary", "primary"],
            selected: true,
            class: "border-accent bg-accent text-accent-ink hover:opacity-90",
        },
    ],
    defaultVariants: {
        variant: "secondary",
        size: "md",
        selected: false,
    },
});

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> &
    VariantProps<typeof chip> & {
        className?: string;
    };

export function Chip({ variant, size, selected, className, type = "button", ...props }: ChipProps) {
    return (
        <button
            type={type}
            aria-pressed={selected ?? false}
            className={chip({ variant, size, selected, className })}
            {...props}
        />
    );
}
