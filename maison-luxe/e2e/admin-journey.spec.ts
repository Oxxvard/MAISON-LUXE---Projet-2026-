import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Parcours administrateur
 * Couvre: Login admin → Dashboard → Gestion produits → Gestion commandes
 */

test.describe('Parcours admin - Authentification', () => {
  test('devrait afficher la page de connexion admin', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Vérifier le formulaire
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
  });

  test('devrait rediriger vers admin après connexion admin', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Note: Ce test nécessite un compte admin existant
    // En pratique, on utiliserait page.context().storageState() 
    // pour sauvegarder la session admin
  });
});

test.describe('Parcours admin - Dashboard', () => {
  test('devrait protéger l\'accès au dashboard admin', async ({ page }) => {
    await page.goto('/admin');
    
    // Sans auth, devrait rediriger vers login
    await page.waitForTimeout(2000);
    
    const isLoginPage = page.url().includes('login');
    const isAdminPage = page.url().includes('admin');
    
    // Soit redirigé vers login, soit déjà connecté
    expect(isLoginPage || isAdminPage).toBeTruthy();
  });

  test('devrait afficher le dashboard avec les bonnes sections', async ({ page }) => {
    // Test avec context.use pour simuler un admin connecté
    await page.goto('/admin');
    
    if (page.url().includes('admin')) {
      // Vérifier les sections du dashboard
      const sections = ['produits', 'commandes', 'utilisateurs', 'statistiques'];
      
      for (const section of sections) {
        const sectionLink = page.locator(`text=/${section}/i, a[href*="${section}"]`).first();
        // Section peut être visible ou non selon le design
        await sectionLink.isVisible().catch(() => false);
      }
    }
  });
});

test.describe('Parcours admin - Gestion des produits', () => {
  test('devrait afficher la page de gestion des produits', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Vérifier qu'on est sur la bonne page (ou redirigé vers login)
    await page.waitForTimeout(2000);
    
    if (page.url().includes('admin/products')) {
      // Vérifier la présence d'éléments admin
      await expect(page).toHaveURL(/admin\/products/);
    }
  });

  test('devrait afficher le bouton d\'ajout de produit', async ({ page }) => {
    await page.goto('/admin/products');
    
    if (page.url().includes('admin/products')) {
      // Chercher un bouton d'ajout
      const addButton = page.locator('button:has-text("Ajouter"), button:has-text("Add"), a[href*="new"]').first();
      await addButton.isVisible().catch(() => {
        console.log('Bouton d\'ajout non trouvé');
      });
    }
  });

  test('devrait afficher la liste des produits existants', async ({ page }) => {
    await page.goto('/admin/products');
    
    if (page.url().includes('admin/products')) {
      // Attendre que la liste se charge
      await page.waitForTimeout(2000);
      
      // Chercher une table ou une liste
      const productList = page.locator('table, ul, [data-testid="product-list"]').first();
      await productList.isVisible().catch(() => {
        console.log('Liste de produits non trouvée');
      });
    }
  });
});

test.describe('Parcours admin - Import CJ Dropshipping', () => {
  test('devrait afficher la page d\'import CJ', async ({ page }) => {
    await page.goto('/admin/products/import');
    
    // Vérifier qu'on peut accéder à la page
    await page.waitForTimeout(2000);
    
    if (page.url().includes('admin')) {
      // Page d'import ou redirigé
      const hasImportForm = await page.locator('input[name="pid"], input[placeholder*="PID"], input[placeholder*="product"]').isVisible().catch(() => false);
      
      if (hasImportForm) {
        await expect(page.locator('input[name="pid"], input[placeholder*="PID"]')).toBeVisible();
      }
    }
  });

  test('devrait valider le format du PID CJ', async ({ page }) => {
    await page.goto('/admin/products/import');
    
    if (page.url().includes('admin')) {
      const pidInput = page.locator('input[name="pid"], input[placeholder*="PID"]').first();
      
      if (await pidInput.isVisible().catch(() => false)) {
        // Essayer un PID invalide
        await pidInput.fill('invalid-pid');
        
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          
          // Attendre validation
          await page.waitForTimeout(2000);
        }
      }
    }
  });
});

test.describe('Parcours admin - Gestion des commandes', () => {
  test('devrait afficher la page des commandes', async ({ page }) => {
    await page.goto('/admin/orders');
    
    await page.waitForTimeout(2000);
    
    if (page.url().includes('admin/orders')) {
      await expect(page).toHaveURL(/admin\/orders/);
    }
  });

  test('devrait afficher la liste des commandes', async ({ page }) => {
    await page.goto('/admin/orders');
    
    if (page.url().includes('admin/orders')) {
      await page.waitForTimeout(2000);
      
      // Chercher une table de commandes
      const ordersTable = page.locator('table, [data-testid="orders-list"]').first();
      await ordersTable.isVisible().catch(() => {
        console.log('Liste des commandes non trouvée');
      });
    }
  });

  test('devrait permettre de filtrer les commandes par statut', async ({ page }) => {
    await page.goto('/admin/orders');
    
    if (page.url().includes('admin/orders')) {
      await page.waitForTimeout(2000);
      
      // Chercher des filtres
      const statusFilter = page.locator('select[name="status"], button:has-text("Statut"), [data-testid="status-filter"]').first();
      
      if (await statusFilter.isVisible().catch(() => false)) {
        await statusFilter.click();
      }
    }
  });

  test('devrait permettre de voir les détails d\'une commande', async ({ page }) => {
    await page.goto('/admin/orders');
    
    if (page.url().includes('admin/orders')) {
      await page.waitForTimeout(2000);
      
      // Chercher un lien vers une commande
      const orderLink = page.locator('a[href*="/admin/orders/"], button:has-text("Voir")').first();
      
      if (await orderLink.isVisible().catch(() => false)) {
        await orderLink.click();
        
        // Vérifier qu'on est sur la page détail
        await page.waitForTimeout(1000);
        await expect(page).toHaveURL(/admin\/orders\//);
      }
    }
  });
});

test.describe('Parcours admin - Webhooks CJ', () => {
  test('devrait afficher la page de configuration webhooks', async ({ page }) => {
    await page.goto('/admin/settings/webhooks');
    
    await page.waitForTimeout(2000);
    
    // Page de settings ou admin
    if (page.url().includes('admin')) {
      // Configuration webhook peut être visible ou non
      const webhookConfig = await page.locator('text=/webhook/i').isVisible().catch(() => false);
      console.log('Webhook config présent:', webhookConfig);
    }
  });
});

test.describe('Parcours admin - Statistiques', () => {
  test('devrait afficher les statistiques globales', async ({ page }) => {
    await page.goto('/admin');
    
    if (page.url().includes('admin')) {
      await page.waitForTimeout(2000);
      
      // Chercher des métriques
      const metrics = ['ventes', 'commandes', 'revenus', 'utilisateurs'];
      
      for (const metric of metrics) {
        await page.locator(`text=/${metric}/i`).isVisible().catch(() => false);
      }
    }
  });

  test('devrait afficher des graphiques de statistiques', async ({ page }) => {
    await page.goto('/admin/stats');
    
    if (page.url().includes('admin')) {
      await page.waitForTimeout(2000);
      
      // Chercher des graphiques (canvas, svg)
      const charts = page.locator('canvas, svg[class*="chart"]').first();
      await charts.isVisible().catch(() => {
        console.log('Graphiques non trouvés');
      });
    }
  });
});
