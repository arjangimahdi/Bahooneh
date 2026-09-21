const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const SCALES = ["", "هزار", "میلیون", "میلیارد", "هزار میلیارد"];

const SEPARATOR = " و ";

function belowThousand(n: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (hundred) parts.push(HUNDREDS[hundred]);
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]);
  } else {
    const ten = Math.floor(rest / 10);
    const one = rest % 10;
    if (ten) parts.push(TENS[ten]);
    if (one) parts.push(ONES[one]);
  }
  return parts.join(SEPARATOR);
}

/** Converts a non-negative integer to Persian words, e.g. 1_250_000 → "یک میلیون و دویست و پنجاه هزار". */
export function numberToPersianWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "صفر";

  const groups: number[] = [];
  let remaining = n;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (!group) continue;
    const scale = SCALES[i];
    if (i === 1 && group === 1) {
      parts.push(scale);
    } else {
      parts.push(scale ? `${belowThousand(group)} ${scale}` : belowThousand(group));
    }
  }

  return parts.join(SEPARATOR);
}
