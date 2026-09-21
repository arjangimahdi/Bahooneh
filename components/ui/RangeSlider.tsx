"use client";

import { useId, type CSSProperties } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { toPersianDigits } from "@/i18n";

const slider = tv({
    slots: {
        root: "flex w-full flex-col gap-2",
        header: "flex items-center justify-between gap-2 text-sm",
        label: "font-medium text-muted",
        values: "text-ink tabular-nums",
        track: "relative flex w-full items-center",
        rail: "absolute inset-x-0 rounded-full bg-line",
        fill: "absolute rounded-full bg-accent",
        input: "range-input absolute inset-x-0 w-full",
    },
    variants: {
        size: {
            sm: {
                track: "h-4",
                rail: "h-0.5",
                fill: "h-0.5",
                input: "h-4 [--thumb:12px]",
            },
            md: {
                track: "h-5",
                rail: "h-1",
                fill: "h-1",
                input: "h-5 [--thumb:16px]",
            },
        },
        disabled: {
            true: {
                root: "opacity-50",
            },
        },
    },
    defaultVariants: {
        size: "md",
        disabled: false,
    },
});

type SliderValue = number | [number, number];

export type RangeSliderProps<T extends SliderValue> = VariantProps<typeof slider> & {
    value: T;
    onChange: (value: T) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    thumbLabels?: T extends number ? string : [string, string];
    formatValue?: (value: number) => string;
    showValues?: boolean;
    className?: string;
    id?: string;
};

function toPercent(value: number, min: number, max: number) {
    if (max <= min) return 0;
    return ((value - min) / (max - min)) * 100;
}

export function RangeSlider<T extends SliderValue>({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    thumbLabels,
    formatValue = toPersianDigits,
    showValues = true,
    size,
    disabled,
    className,
    id,
}: RangeSliderProps<T>) {
    const generatedId = useId();
    const baseId = id ?? generatedId;
    const styles = slider({ size, disabled, className });
    const isRange = Array.isArray(value);
    const [low, high] = isRange ? value : [min, value];

    const fillStyle: CSSProperties = {
        insetInlineStart: `${toPercent(low, min, max)}%`,
        insetInlineEnd: `${100 - toPercent(high, min, max)}%`,
    };

    const emit = (next: [number, number]) => {
        onChange((isRange ? next : next[1]) as T);
    };

    const handleLow = (raw: number) => emit([Math.min(raw, high), high]);
    const handleHigh = (raw: number) => emit([low, Math.max(raw, isRange ? low : min)]);

    const [lowLabel, highLabel] = isRange
        ? ((thumbLabels as [string, string] | undefined) ?? [label, label])
        : [undefined, (thumbLabels as string | undefined) ?? label];

    const shared = {
        min,
        max,
        step,
        disabled,
        className: styles.input(),
    };

    return (
        <div className={styles.root()}>
            {(label || showValues) && (
                <div className={styles.header()}>
                    {label && (
                        <label htmlFor={`${baseId}-high`} className={styles.label()}>
                            {label}
                        </label>
                    )}
                    {showValues && (
                        <span className={styles.values()} dir="ltr">
                            {isRange ? `${formatValue(low)} – ${formatValue(high)}` : formatValue(high)}
                        </span>
                    )}
                </div>
            )}
            <div className={styles.track()}>
                <div className={styles.rail()} />
                <div className={styles.fill()} style={fillStyle} />
                {isRange && (
                    <input
                        {...shared}
                        type="range"
                        id={`${baseId}-low`}
                        value={low}
                        aria-label={lowLabel}
                        aria-valuetext={formatValue(low)}
                        onChange={(e) => handleLow(Number(e.target.value))}
                    />
                )}
                <input
                    {...shared}
                    type="range"
                    id={`${baseId}-high`}
                    value={high}
                    aria-label={highLabel}
                    aria-valuetext={formatValue(high)}
                    onChange={(e) => handleHigh(Number(e.target.value))}
                />
            </div>
        </div>
    );
}
