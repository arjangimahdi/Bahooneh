import { tv } from "tailwind-variants";

export const field = tv({
    slots: {
        root: "flex w-full flex-col gap-1.5",
        label: "text-sm font-medium text-muted",
        control: [
            "w-full rounded-card border bg-surface text-ink placeholder:text-muted/70",
            "border-line transition-colors duration-150",
            "hover:border-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
        ],
        message: "text-sm text-muted",
    },
    variants: {
        size: {
            sm: { control: "px-3 py-2 text-sm" },
            md: { control: "px-4 py-3 text-base" },
        },
        invalid: {
            true: {
                label: "text-warn",
                control: "border-warn hover:border-warn focus:border-warn focus-visible:ring-warn/30",
                message: "text-warn",
            },
        },
    },
    defaultVariants: {
        size: "md",
        invalid: false,
    },
});
