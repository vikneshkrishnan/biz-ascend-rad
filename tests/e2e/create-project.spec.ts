import { test, expect } from '@playwright/test';
import { enterDemoMode, waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('Create Project Flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Can navigate to and fill the create project form', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate to projects
    const projectsNav = page.locator('button', { hasText: 'Projects' });
    await projectsNav.click();
    
    // Click Create Project button (should be on the projects list page)
    const createBtn = page.getByRole('button', { name: /create project/i });
    await createBtn.click();
    
    // Verify we are on the create project page
    await expect(page.locator('h1')).toContainText('Initiate New Project');
    
    // Fill the form
    await page.getByTestId('project-company-input').fill('Test Redesign Corp');
    
    // Select industry
    const industrySelect = page.getByTestId('project-industry-select');
    await industrySelect.click();
    await page.getByRole('option', { name: 'SaaS / Software Platforms' }).click();
    
    // Fill contact info
    await page.getByLabel(/full name/i).fill('Design Tester');
    await page.getByLabel(/email address/i).fill('tester@design.com');
    await page.getByLabel(/strategic notes/i).fill('Testing the new redesign aesthetics.');
    
    // Verify sidebar exists
    await expect(page.getByText(/The RAD™ Process/i)).toBeVisible();
    await expect(page.getByText(/Project Initiation/i)).toBeVisible();
    
    // Submit the form
    const submitBtn = page.getByTestId('create-project-btn');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    
    // In demo mode/apiFetch mock, it should succeed and navigate
    // Wait for toast or navigation
    await expect(page.getByText(/Project created successfully/i)).toBeVisible();
    
    // Should be on project detail page now
    await expect(page.locator('h1')).toContainText('Test Redesign Corp', { timeout: 10000 });
  });

  test('Shows validation error if required fields are missing', async ({ page }) => {
    await enterDemoMode(page);
    
    // Navigate directly to create project page hash
    await page.goto('/#/projects/new');
    
    // Try to submit empty form
    const submitBtn = page.getByTestId('create-project-btn');
    await submitBtn.click();
    
    // Check for error toast
    await expect(page.getByText(/Please fill in required fields/i)).toBeVisible();
  });
});
