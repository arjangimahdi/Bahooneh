import { chipLabel, type Dictionary } from "@/i18n";
import { Chip } from "./Chip";

interface Props<T extends string> {
    group: keyof Dictionary["chips"];
    label: string;
    hint?: string;
    chips: readonly T[];
    value: readonly T[];
    multiSelect?: boolean;
    onChange: (ids: T[]) => void;
}

export function ChipGroup<T extends string>({
    group,
    label,
    hint,
    chips,
    value,
    multiSelect = false,
    onChange,
}: Props<T>) {
    const toggle = (id: T) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange(multiSelect ? [...value, id] : [id]);
        }
    };

    return (
        <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-muted">
                {label}
                {hint && <span className="ms-1 text-xs font-normal text-muted/80">{hint}</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
                {chips.map((id) => (
                    <Chip key={id} variant="primary" selected={value.includes(id)} onClick={() => toggle(id)}>
                        {chipLabel(group, id)}
                    </Chip>
                ))}
            </div>
        </fieldset>
    );
}
