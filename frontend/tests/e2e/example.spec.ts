import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Resume Analyzer/);
});

test('can navigate to upload page', async ({ page }) => {
    await page.goto('/');

    // Check if "Upload Resume" link/button exists and click it
    // Note: Adjust selector based on actual UI
    const uploadLink = page.getByRole('link', { name: /Upload/i }).first();
    // Or check for navigation
    await uploadLink.click();

    // Expect url to be /upload
    await expect(page).toHaveURL(/.*upload/);
})
