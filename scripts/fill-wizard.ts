import { chromium, type Page } from 'playwright';

const BASE_URL = process.env.WIZARD_URL ?? 'http://localhost:3000/wizard';

// Stop after step N:  npm run fill -- --until=3
const untilArg = process.argv.find((a) => a.startsWith('--until='));
const UNTIL = untilArg ? Number(untilArg.split('=')[1]) : Infinity;

const btn = (page: Page, name: string) => page.getByRole('button', { name }).click();
const next = (page: Page) => btn(page, 'بعدی');

const steps: Array<(page: Page) => Promise<void>> = [
  // Step 1 — recipient (age, gender, relation)
  async (page) => {
    await btn(page, 'کودک');
    await btn(page, 'مرد');
    await btn(page, 'خواهر / برادر');
    await next(page);
  },
  // Step 2 — occasion & personality
  async (page) => {
    await btn(page, 'تولد');
    await btn(page, 'بامزه و شوخ');
    await btn(page, 'رسمی');
    await btn(page, 'کاربردی');
    await next(page);
  },
  // Step 3 — interests
  async (page) => {
    await btn(page, 'تکنولوژی و گجت');
    await btn(page, 'طبیعت‌گردی');
    await next(page);
  },
  // Step 4 — exclusions / already has
  async (page) => {
    await btn(page, 'لباس نه');
    await btn(page, 'ساعت هوشمند داره');
    await btn(page, 'رایحه و اسانس');
    await next(page);
  },
  // Step 5 — budget
  async (page) => {
    await btn(page, '۱ تا ۳ میلیون');
  },
  // Step 6 — submit
  async (page) => {
    await btn(page, 'هدیه‌ی مناسبش رو پیدا کن');
  },
];

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];

  // Find your already-open wizard tab
  let page = context.pages().find((p) => p.url().includes('/wizard'));
  if (!page) {
    console.log('No wizard tab found — opening one');
    page = await context.newPage();
  }

  await page.bringToFront();
  await page.goto(BASE_URL); // restart the wizard from step 1 in the same tab

  const count = Math.min(UNTIL, steps.length);
  for (let i = 0; i < count; i++) {
    console.log(`▶ Step ${i + 1}/${steps.length}`);
    await steps[i](page);
  }

  console.log('✔ Done');
  await browser.close(); // only disconnects the script — your Chrome stays open
})();