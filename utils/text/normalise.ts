export function normaliseText(text: string): string {
    return text
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/‌/g, " ")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

export function toWords(text: string): string[] {
    const normalised = normaliseText(text);
    return normalised === "" ? [] : normalised.split(" ");
}
