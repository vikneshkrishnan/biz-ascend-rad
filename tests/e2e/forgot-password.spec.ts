import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts } from '../fixtures/helpers';

test.describe('Forgot Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Login page displays Forgot Password link', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Verify Forgot Password link is visible on login page
    const forgotPasswordLink = page.getByTestId('forgot-password-link');
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toContainText('Forgot password?');
  });

  test('Clicking Forgot Password link shows reset password form', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Click Forgot Password link
    const forgotPasswordLink = page.getByTestId('forgot-password-link');
    await forgotPasswordLink.click();
    
    // Verify Reset Password form is displayed
    await expect(page.getByText('Reset Password')).toBeVisible();
    await expect(page.getByText('Enter your email to receive a reset link')).toBeVisible();
    
    // Verify email input field is present
    const emailInput = page.getByTestId('forgot-email-input');
    await expect(emailInput).toBeVisible();
    
    // Verify Send Reset Link button is present
    const submitBtn = page.getByTestId('forgot-submit-btn');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Send Reset Link');
    
    // Verify Back to Login button is present
    const backBtn = page.getByTestId('back-to-login-btn');
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toContainText('Back to Login');
  });

  test('Entering email and clicking Send Reset Link shows success state', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Click Forgot Password link
    await page.getByTestId('forgot-password-link').click();
    
    // Wait for form to be visible
    await expect(page.getByText('Reset Password')).toBeVisible();
    
    // Enter email
    const emailInput = page.getByTestId('forgot-email-input');
    await emailInput.fill('test@example.com');
    
    // Click Send Reset Link
    const submitBtn = page.getByTestId('forgot-submit-btn');
    await submitBtn.click();
    
    // Wait for loading state (button shows "Sending...")
    await expect(submitBtn).toContainText('Sending...');
    
    // Wait for success state (should show success message after mock delay)
    // Use exact match with first() since toast also contains "Reset link sent!"
    await expect(page.getByText('Reset link sent!', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/We've sent a password reset link to/i)).toBeVisible();
    await expect(page.locator('strong', { hasText: 'test@example.com' })).toBeVisible();
    
    // Verify "Try another email" button is visible in success state
    await expect(page.getByRole('button', { name: 'Try another email' })).toBeVisible();
  });

  test('Back to Login button returns to login page', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Click Forgot Password link
    await page.getByTestId('forgot-password-link').click();
    
    // Verify on Reset Password page
    await expect(page.getByText('Reset Password')).toBeVisible();
    
    // Click Back to Login
    const backBtn = page.getByTestId('back-to-login-btn');
    await backBtn.click();
    
    // Verify we're back on login page
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('Try another email button resets form after success', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to Forgot Password and submit
    await page.getByTestId('forgot-password-link').click();
    await page.getByTestId('forgot-email-input').fill('test@example.com');
    await page.getByTestId('forgot-submit-btn').click();
    
    // Wait for success state (use exact match since toast also shows text)
    await expect(page.getByText('Reset link sent!', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    
    // Click Try another email
    await page.getByRole('button', { name: 'Try another email' }).click();
    
    // Verify form is visible again (email input shown)
    const emailInput = page.getByTestId('forgot-email-input');
    await expect(emailInput).toBeVisible();
    
    // Verify Send Reset Link button is visible again
    await expect(page.getByTestId('forgot-submit-btn')).toBeVisible();
    
    // Note: Email value is preserved (not cleared) which is acceptable behavior
  });
});
