import { test, expect } from '@playwright/test';
import { loginWithCredentials, dismissToasts } from '../fixtures/helpers';

const EMAIL = 'admin@email.com';
const PASSWORD = 'admin1234!';

test.describe('Real Login - Core Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Login with real credentials and reach dashboard', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    // Verify dashboard elements
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active Diagnostics')).toBeVisible();
  });

  test('Dashboard displays stats cards', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active Diagnostics')).toBeVisible();
    await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Consultants')).toBeVisible();
  });

  test('Theme toggle works', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    const themeToggle = page.getByTestId('theme-toggle');
    await expect(themeToggle).toBeVisible();

    const initialBgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );

    await themeToggle.click();
    await page.waitForTimeout(500);

    const newBgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );

    expect(initialBgColor).not.toBe(newBgColor);
  });

  test('Navigate to Projects page', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();

    await expect(page.locator('h1')).toContainText('Projects');
    await expect(page.getByText(/total projects/i)).toBeVisible();
  });
});

test.describe('Real Login - Projects', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Projects list shows projects with status badges', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();

    await expect(page.locator('h1')).toContainText('Projects');

    // Verify at least some projects are listed
    const projectCards = page.locator('[class*="card" i], [class*="Card"]');
    await expect(projectCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Can open a project detail page', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    await expect(page.locator('h1')).toContainText('Projects');

    // Click the first project card
    const firstProject = page.locator('[class*="card" i], [class*="Card"]').first();
    await firstProject.click();

    // Verify project detail elements
    await expect(page.getByText('Screener')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Diagnostic')).toBeVisible();
    await expect(page.getByText('Scores & Report')).toBeVisible();
  });

  test('Create project form loads and validates', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    // Navigate to create project
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    await expect(page.locator('h1')).toContainText('Projects');

    const createBtn = page.getByRole('button', { name: /create project/i });
    await createBtn.click();

    // Verify form loaded
    await expect(page.locator('h1')).toContainText(/New Project|Initiate New Project/i, { timeout: 10000 });

    // Try submitting empty form - should show validation error
    const submitBtn = page.getByTestId('create-project-btn');
    await submitBtn.click();

    await expect(page.getByText(/Please fill in required fields/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Real Login - Scores & Reports', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Navigate to a project scores page', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    // Navigate to projects
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    await expect(page.locator('h1')).toContainText('Projects');

    // Click the first project
    const firstProject = page.locator('[class*="card" i], [class*="Card"]').first();
    await firstProject.click();

    // Click View Scores if available
    const viewScoresBtn = page.getByRole('button', { name: 'View Scores' });
    const hasScores = await viewScoresBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasScores) {
      await viewScoresBtn.click();
      await expect(page.getByText('RAD Growth System Score')).toBeVisible({ timeout: 10000 });

      // Verify key score elements
      await expect(page.getByText('Primary Growth Constraint')).toBeVisible();
      await expect(page.getByText('Pillar Performance')).toBeVisible();
    }
  });

  test('Export CSV and Download PDF buttons are visible on scores page', async ({ page }) => {
    await loginWithCredentials(page, EMAIL, PASSWORD);

    // Navigate to projects and find one with scores
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    await expect(page.locator('h1')).toContainText('Projects');

    const firstProject = page.locator('[class*="card" i], [class*="Card"]').first();
    await firstProject.click();

    const viewScoresBtn = page.getByRole('button', { name: 'View Scores' });
    const hasScores = await viewScoresBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasScores) {
      await viewScoresBtn.click();
      await expect(page.getByText('RAD Growth System Score')).toBeVisible({ timeout: 10000 });

      // Check Export CSV button
      const exportCsvBtn = page.getByTestId('export-csv-btn');
      await expect(exportCsvBtn).toBeVisible();
      await expect(exportCsvBtn).toBeEnabled();

      // Check Download PDF button
      const downloadPdfBtn = page.getByTestId('download-pdf-btn');
      await expect(downloadPdfBtn).toBeVisible();
      await expect(downloadPdfBtn).toBeEnabled();

      // Check Generate AI Report button
      const generateBtn = page.getByTestId('generate-report-btn');
      await expect(generateBtn).toBeVisible();
      await expect(generateBtn).toBeEnabled();
    }
  });
});
