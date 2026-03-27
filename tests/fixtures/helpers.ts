import { Page, expect } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

export async function enterDemoMode(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Click on the Explore Demo button
  const demoButton = page.getByRole('button', { name: /Explore Demo/i });
  await expect(demoButton).toBeVisible();
  await demoButton.click();

  // Wait for navigation to dashboard
  await expect(page.locator('h1')).toContainText('Dashboard');
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const emailInput = page.getByTestId('login-email-input');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(email);

  await page.getByTestId('login-password-input').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for navigation to dashboard
  await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 15000 });
}

export async function navigateToProjects(page: Page) {
  const projectsNav = page.locator('button', { hasText: 'Projects' });
  await projectsNav.click();
  await expect(page.locator('h1')).toContainText('Projects');
}

export async function navigateToProject(page: Page, projectName: string) {
  // Find and click on the project card
  const projectCard = page.locator('[class*="Card"]', { hasText: projectName });
  await projectCard.first().click();
}

export async function navigateToScores(page: Page, projectId: string) {
  await page.goto(`/#/projects/${projectId}/scores`);
  await page.waitForLoadState('domcontentloaded');
}
