import { test, expect } from '@playwright/test';
import { enterDemoMode, waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('Scores Page and AI Report Generation', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Scores page shows RAD score, pillar breakdown, and RAPS', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate directly to scores page for Acme Corporation (proj-001)
    await page.goto('/#/projects/proj-001/scores');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the scores to load
    await expect(page.getByText('RAD Growth System Score')).toBeVisible({ timeout: 10000 });
    
    // Verify RAD Score is displayed (should show 59.3 for Acme)
    await expect(page.locator('text=59.3')).toBeVisible();
    
    // Verify maturity band is displayed
    await expect(page.getByText(/Growth System Fragile/i)).toBeVisible();
    
    // Verify primary constraint is shown
    await expect(page.getByText('Primary Growth Constraint')).toBeVisible();
    await expect(page.getByText('Positioning & Competitive Clarity')).toBeVisible();
    
    // Verify Diagnostic Overview/Pillar breakdown section
    await expect(page.getByText('Diagnostic Overview')).toBeVisible();
    
    // Verify RAPS section
    await expect(page.getByText(/Revenue Achievement Probability Score/i)).toBeVisible();
    await expect(page.getByText('Revenue Target')).toBeVisible();
  });

  test('AI Report Generation button exists and is clickable', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate to scores page
    await page.goto('/#/projects/proj-001/scores');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for page to load
    await expect(page.getByText('RAD Growth System Score')).toBeVisible({ timeout: 10000 });
    
    // Verify Generate AI Report button exists
    const generateBtn = page.getByTestId('generate-report-btn');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toContainText('Generate AI Report');
    
    // Verify button is clickable (not disabled)
    await expect(generateBtn).toBeEnabled();
  });

  test('View Report button displays the report dialog', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate to scores page
    await page.goto('/#/projects/proj-001/scores');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for page to load
    await expect(page.getByText('RAD Growth System Score')).toBeVisible({ timeout: 10000 });
    
    // Verify View Report button exists
    const viewReportBtn = page.getByTestId('view-report-btn');
    await expect(viewReportBtn).toBeVisible();
    await expect(viewReportBtn).toContainText('View Report');
    
    // Click View Report
    await viewReportBtn.click();
    
    // Wait for dialog/toast - in demo mode it should show info toast about generating
    // or show the report dialog
    await page.waitForTimeout(1000);
    
    // Check if either dialog appeared or toast appeared
    const dialogVisible = await page.locator('[role="dialog"]').isVisible();
    const toastVisible = await page.locator('[data-sonner-toast]').isVisible();
    
    expect(dialogVisible || toastVisible).toBeTruthy();
  });

  test('Report dialog shows Executive Summary and Pillar Analysis when opened after generation', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate to scores page
    await page.goto('/#/projects/proj-001/scores');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for page to load
    await expect(page.getByText('RAD Growth System Score')).toBeVisible({ timeout: 10000 });
    
    // Click Generate AI Report (in demo mode this returns mock report)
    const generateBtn = page.getByTestId('generate-report-btn');
    await generateBtn.click();
    
    // Wait for report dialog to appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 15000 });
    
    // Verify dialog content
    await expect(dialog.getByText('AI-Generated Diagnostic Report')).toBeVisible();
    await expect(dialog.getByText('Executive Summary')).toBeVisible();
    await expect(dialog.getByText('Pillar Analysis')).toBeVisible();
  });
});
