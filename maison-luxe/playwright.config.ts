import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour tests E2E
 * Adaptée pour Next.js 15 avec environnement dev container
 */
export default defineConfig({
  // Dossier des tests E2E
  testDir: './e2e',
  
  // Timeout pour chaque test (30s)
  timeout: 30 * 1000,
  
  // Timeout pour les expect (5s)
  expect: {
    timeout: 5000,
  },
  
  // Exécution complète même si des tests échouent
  fullyParallel: true,
  
  // Interdit l'usage du .only en CI
  forbidOnly: !!process.env.CI,
  
  // 2 retries en CI, 0 en local
  retries: process.env.CI ? 2 : 0,
  
  // Nombre de workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['list'],
  ],
  
  // Configuration partagée pour tous les tests
  use: {
    // URL de base - Next.js dev server
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collecter les traces en cas d'échec
    trace: 'on-first-retry',
    
    // Screenshots en cas d'échec
    screenshot: 'only-on-failure',
    
    // Vidéos en cas d'échec
    video: 'retain-on-failure',
  },

  // Configuration des projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serveur web de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
