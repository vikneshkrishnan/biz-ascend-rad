import { test, expect } from '@playwright/test';
import { enterDemoMode, waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('Biz Ascend RAD - Demo Mode and Core Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Login page displays correctly', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify login page elements
    await expect(page.locator('h1')).toContainText('Biz Ascend RAD');
    await expect(page.getByText('Revenue Acceleration Diagnostic Platform')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Explore Demo/i })).toBeVisible();
  });

  test('Click Explore Demo enters demo mode and shows dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Click on the Explore Demo button
    const demoButton = page.getByRole('button', { name: /Explore Demo/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();
    
    // Wait for navigation to dashboard
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 });
    
    // Verify demo badge appears (use exact match to avoid strict mode)
    await expect(page.getByText('Demo', { exact: true }).first()).toBeVisible();
    
    // Verify dashboard shows welcome message
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
  });

  test('Dashboard displays stats cards correctly', async ({ page }) => {
    await enterDemoMode(page);
    
    // Check for dashboard stats cards
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active Diagnostics')).toBeVisible();
    await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Consultants')).toBeVisible();
    
    // Verify stat values are displayed (should show numbers - 7 projects, 4 consultants)
    await expect(page.getByText('7')).toBeVisible();
    await expect(page.getByText('4').first()).toBeVisible();
  });

  test('Theme toggle switches between dark and light modes', async ({ page }) => {
    await enterDemoMode(page);
    
    // Get initial state - should be dark by default
    const themeToggle = page.getByTestId('theme-toggle');
    await expect(themeToggle).toBeVisible();
    
    // Initial state: dark mode - check background color is dark
    const initialBgColor = await page.evaluate(() => 
      window.getComputedStyle(document.body).backgroundColor
    );
    
    // Click to toggle theme
    await themeToggle.click();
    
    // Wait for theme transition
    await page.waitForTimeout(500);
    
    // Verify theme changed - background should be different
    const newBgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    
    // The colors should be different after toggle
    expect(initialBgColor).not.toBe(newBgColor);
    
    // Toggle back to dark
    await themeToggle.click();
    await page.waitForTimeout(500);
    
    // Verify it's back to original
    const finalBgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(finalBgColor).toBe(initialBgColor);
  });

  test('Navigation to Projects page works', async ({ page }) => {
    await enterDemoMode(page);
    
    // Click on Projects in sidebar
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    
    // Verify we're on projects page
    await expect(page.locator('h1')).toContainText('Projects');
    await expect(page.getByText(/total projects/i)).toBeVisible();
  });
});
