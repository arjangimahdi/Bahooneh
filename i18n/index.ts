import fa, { type Dictionary } from "./fa";

/** Recursively builds the dotted key paths of a nested dictionary ("wizard.target.title"). */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TKey = Paths<Dictionary>;

export const locale = "fa-IR";
export const dir = "rtl";

/**
 * Looks up a key in the active dictionary and interpolates `{var}` placeholders.
 * Falls back to the key itself so a missing translation is visible, not silent.
 */
export function t(key: TKey, vars?: Record<string, string | number>): string {
  const value = key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, fa);
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

/** Chip label lookup for a given option group and option id. Untyped because ids are data-driven. */
export function chipLabel(group: keyof Dictionary["chips"], id: string): string {
  const groupDict = fa.chips[group] as Record<string, string>;
  return groupDict[id] ?? id;
}

const digits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Converts ASCII digits in any string to Persian digits. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => digits[Number(d)]);
}

/** Formats a Toman amount with Persian grouping and digits, e.g. "۱٬۲۴۰٬۰۰۰". */
export function formatToman(amount: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}
