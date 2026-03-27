import { test, expect } from '@playwright/test';

const PROJECT_ID = '879feb31-5119-4cd2-a949-aba6eb74f23e';

test('Fill screener form with real data for NovaTech Solutions', async ({ page }) => {
  test.setTimeout(120_000);

  // --- Login ---
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('[data-testid="login-email-input"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill('admin@email.com');
    await page.locator('[data-testid="login-password-input"]').fill('admin1234!');
    await page.locator('[data-testid="login-submit-btn"]').click();
    await page.waitForTimeout(3000);
  }

  // --- Navigate to screener ---
  await page.evaluate((id) => { window.location.hash = `#/projects/${id}/screener`; }, PROJECT_ID);
  await expect(page.locator('h1')).toContainText('Business Context', { timeout: 15000 });

  // Helper: find a question group by label text, then interact with its input
  function questionGroup(labelText: string) {
    return page.locator('div.group', { hasText: labelText });
  }

  // Helper: click a radio/checkbox option within a specific question group
  async function pickOption(labelText: string, optionText: string) {
    await questionGroup(labelText).locator('div.cursor-pointer', { hasText: optionText }).click();
  }

  // Helper: click next section button
  async function nextSection() {
    await page.waitForTimeout(1500);
    const nextBtn = page.getByRole('button', { name: /Proceed to Phase/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  // ===== SECTION 1: Respondent Details =====
  await questionGroup('Respondent Name').locator('input').fill('Sarah Mitchell');
  await pickOption('Designation', 'CEO/Founder');
  await questionGroup('Email Address').locator('input').fill('sarah.mitchell@novatech.com.au');
  await nextSection();

  // ===== SECTION 2: Company Context =====
  await questionGroup('Company Name').locator('input').fill('NovaTech Solutions Pty Ltd');

  // Industry select
  await questionGroup('Industry').locator('button[role="combobox"]').click();
  await page.getByRole('option', { name: 'SaaS / Software Platforms' }).click();

  // Primary Markets (multiselect = text input)
  await questionGroup('Primary Markets').locator('input').fill('Australia, New Zealand, Southeast Asia, United States');

  await pickOption('Annual Revenue Range', '$5–20M');
  await pickOption('Number of Sales Staff', '11–20');
  await pickOption('Annual Marketing Budget', '$500k–1M');
  await nextSection();

  // ===== SECTION 3: Sales Model =====
  await pickOption('Primary Sales Model', 'Hybrid');
  await nextSection();

  // ===== SECTION 4: Go-To-Market Context (checkboxes) =====
  await pickOption('Primary GTM Channels', 'Content/inbound marketing');
  await pickOption('Primary GTM Channels', 'Paid advertising');
  await pickOption('Primary GTM Channels', 'Events/trade shows');
  await pickOption('Primary GTM Channels', 'Partnerships/channel');
  await nextSection();

  // ===== SECTION 5: Positioning Inputs =====
  await questionGroup('Positioning Statement').locator('textarea').fill(
    'NovaTech is the only workforce management platform purpose-built for mid-market enterprises in regulated industries, combining AI-driven scheduling with built-in compliance automation — eliminating the need for separate HR, rostering, and compliance tools.'
  );

  await questionGroup('Top 3 Competitors').locator('textarea').fill(
    '1. Workday — dominant in enterprise but overbuilt and expensive for mid-market\n' +
    '2. Deputy — strong in SMB shift scheduling but lacks compliance depth\n' +
    '3. BambooHR — popular for core HR but weak on workforce planning and rostering'
  );

  await pickOption('Average Deal Size', '$25k–$100k');
  await pickOption('Average Sales Cycle', '3–6 months');
  await nextSection();

  // ===== SECTION 6: Pipeline Context =====
  await questionGroup('Total Open Pipeline').locator('input').fill('4,200,000');
  await pickOption('Average Win Rate', '20–30%');
  await nextSection();

  // ===== SECTION 7: Revenue Target Inputs =====
  await questionGroup('Current FY Revenue Target').locator('input').fill('12,000,000');
  await questionGroup('Revenue Already Invoiced').locator('input').fill('7,800,000');

  // Fiscal Year End Month select
  await questionGroup('Fiscal Year End').locator('button[role="combobox"]').click();
  await page.getByRole('option', { name: 'June' }).click();

  // Wait for auto-save
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'tests/test-results/screener-final-section.png', fullPage: true });

  // Submit
  const submitBtn = page.getByRole('button', { name: /Submit|Lock|Finalize/i });
  await expect(submitBtn).toBeEnabled({ timeout: 10000 });
  await submitBtn.click();

  await expect(page.getByText(/captured successfully|submitted/i)).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'tests/test-results/screener-submitted.png', fullPage: true });
});
