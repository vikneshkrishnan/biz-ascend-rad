import { test, expect } from '@playwright/test';

test('Fill create project form with real data', async ({ page }) => {
  // First load the app and wait for it to be ready
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Wait for the app to fully load (dashboard or login)
  await page.waitForTimeout(3000);

  // Now navigate to create project via hash
  await page.evaluate(() => { window.location.hash = '#/projects/new'; });

  // Wait for the form to be visible
  await expect(page.locator('h1')).toContainText('New Project', { timeout: 15000 });

  // Fill Company Name
  await page.locator('#companyName').fill('NovaTech Solutions Pty Ltd');

  // Select Industry - click the select trigger then pick an option
  const industryTrigger = page.locator('button[role="combobox"]').first();
  await industryTrigger.click();
  await page.getByRole('option', { name: 'SaaS / Software Platforms' }).click();

  // Select Consultant (if admin - the "Assign to Consultant" dropdown)
  const consultantTrigger = page.locator('button[role="combobox"]').nth(1);
  if (await consultantTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consultantTrigger.click();
    // Pick the first available consultant
    await page.getByRole('option').first().click();
  }

  // Fill Contact Name
  await page.locator('#contactName').fill('Sarah Mitchell');

  // Fill Contact Email
  await page.locator('#contactEmail').fill('sarah.mitchell@novatech.com.au');

  // Fill Strategic Notes
  await page.locator('#notes').fill(
    'NovaTech is a B2B SaaS company providing workforce management solutions to mid-market enterprises in APAC. ' +
    'They are looking to expand into the US market and need to refine their go-to-market strategy. ' +
    'Current ARR is approximately $8M with 120 enterprise clients. Key challenges include long sales cycles (6+ months) ' +
    'and difficulty differentiating from established US competitors like Workday and BambooHR. ' +
    'CEO wants to explore channel partnerships and product-led growth motions to accelerate market entry.'
  );

  // Verify the submit button is enabled (all required fields filled)
  const submitBtn = page.getByRole('button', { name: /Create Project/i });
  await expect(submitBtn).toBeEnabled({ timeout: 5000 });

  // Take a screenshot of the filled form before submitting
  await page.screenshot({ path: 'tests/test-results/filled-form.png', fullPage: true });

  // Submit the form
  await submitBtn.click();

  // Wait for success - either a toast or navigation to project detail
  await expect(
    page.getByText(/Project created/i).or(page.locator('h1').filter({ hasNotText: 'New Project' }))
  ).toBeVisible({ timeout: 15000 });

  // Take a screenshot of the result
  await page.screenshot({ path: 'tests/test-results/after-submit.png', fullPage: true });
});
