import { test, expect } from '@playwright/test';

test('homepage has expected content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Daisy's Secrets/i);
});

test.describe('Age Gate behavior', () => {
    test('should display age gate if no age status is set', async ({ page }) => {
        // 1) Navega y limpia storage
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // 2) Aquí debe aparecer el AgeGate
        await expect(page.locator('h1')).toHaveText(/¿Tenés más de 18 años\?/i);
    });

    test('should skip age gate and intro animation when user already accepted', async ({ page, context }) => {
        // 1) Inyecta el estado aprobado + animación completada ANTES de cargar la app
        await context.addInitScript(() => {
            localStorage.setItem('age-verification', 'approved');
        });

        // 2) Al navegar, ni AgeGate ni IntroAnimation deberían verse
        await page.goto('/');
        await page.reload();

        // 3) Verifica que tu header real esté presente
        await expect(page.locator('header')).toBeVisible();
        // Opcionalmente comprobar el logo/brand en el header
        await expect(page.locator('header').getByRole('link', { name: /Daisy’s Secrets/i })).toBeVisible();
    });
});
