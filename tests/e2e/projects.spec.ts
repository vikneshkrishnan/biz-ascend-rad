import { test, expect } from '@playwright/test';
import { enterDemoMode, waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('Projects List and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Projects list shows projects with correct status', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate to projects
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    
    await expect(page.locator('h1')).toContainText('Projects');
    
    // Verify projects are displayed
    await expect(page.getByText('Acme Corporation')).toBeVisible();
    await expect(page.getByText('Nova Health Systems')).toBeVisible();
    
    // Verify status badges are displayed
    await expect(page.locator('text=Completed').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
  });

  test('Project detail page displays correctly', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate to projects
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    
    // Click on a completed project (Acme Corporation)
    const projectCard = page.locator('[class*="Card"]', { hasText: 'Acme Corporation' });
    await projectCard.first().click();
    
    // Verify project detail page
    await expect(page.getByText('Acme Corporation')).toBeVisible();
    await expect(page.getByText('SaaS / Software Platforms')).toBeVisible();
    
    // Verify assessment cards are visible
    await expect(page.getByText('Screener')).toBeVisible();
    await expect(page.getByText('Diagnostic')).toBeVisible();
    await expect(page.getByText('Scores & Report')).toBeVisible();
  });

  test('Navigate to scores page from project detail', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate to projects
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    
    // Click on Acme Corporation (completed project with scores)
    const projectCard = page.locator('[class*="Card"]', { hasText: 'Acme Corporation' });
    await projectCard.first().click();
    
    // Click View Scores button
    const viewScoresBtn = page.getByRole('button', { name: 'View Scores' });
    await expect(viewScoresBtn).toBeVisible();
    await viewScoresBtn.click();
    
    // Verify scores page elements
    await expect(page.getByText('RAD Growth System Score')).toBeVisible();
  });
});
