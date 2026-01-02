/**
 * Tests pour la logique de validation products
 * Teste les schemas sans appeler directement les routes
 */

import { CreateProductSchema, UpdateProductSchema } from '@/lib/schemas';

describe('Product Validation Logic', () => {
  describe('CreateProductSchema', () => {
    it('devrait accepter des données de produit valides', () => {
      const validProduct = {
        name: 'Produit Test',
        slug: 'produit-test',
        description: 'Description complète du produit test',
        price: 99.99,
        costPrice: 50.00,
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        category: 'electronics',
        stock: 10,
      };

      const result = CreateProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un prix négatif', () => {
      const invalidProduct = {
        name: 'Produit Test',
        slug: 'produit-test',
        description: 'Description',
        price: -10,
        costPrice: 50,
        images: ['https://example.com/image.jpg'],
        category: 'electronics',
        stock: 10,
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom vide', () => {
      const invalidProduct = {
        name: '',
        slug: 'produit-test',
        description: 'Description du produit',
        price: 99.99,
        costPrice: 50,
        images: ['https://example.com/image.jpg'],
        category: 'electronics',
        stock: 10,
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un slug vide', () => {
      const invalidProduct = {
        name: 'Produit Test',
        slug: '',
        description: 'Description du produit',
        price: 99.99,
        costPrice: 50,
        images: ['https://example.com/image.jpg'],
        category: 'electronics',
        stock: 10,
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un stock négatif', () => {
      const invalidProduct = {
        name: 'Produit Test',
        slug: 'produit-test',
        description: 'Description du produit',
        price: 99.99,
        costPrice: 50,
        images: ['https://example.com/image.jpg'],
        category: 'electronics',
        stock: -5,
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('devrait accepter un produit sans features (optionnel)', () => {
      const validProduct = {
        name: 'Produit Test',
        slug: 'produit-test',
        description: 'Description complète du produit',
        price: 99.99,
        costPrice: 50,
        images: ['https://example.com/image.jpg'],
        category: 'electronics',
        stock: 10,
      };

      const result = CreateProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });
  });
});
