/**
 * Tests unitaires pour la validation Zod
 * Critique car valide toutes les entrées utilisateur
 */

import {
  LoginSchema,
  RegisterSchema,
  CreateProductSchema,
  CreateOrderSchema,
  ShippingAddressSchema,
  CreateCouponSchema,
} from '@/lib/schemas';

describe('Schemas Zod - Validation', () => {
  describe('LoginSchema', () => {
    it('devrait valider un login correct', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'Password123',
      };
      const result = LoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un email invalide', () => {
      const invalidLogin = {
        email: 'not-an-email',
        password: 'Password123',
      };
      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('devrait rejeter un mot de passe trop court', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '123',
      };
      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('devrait rejeter des champs manquants', () => {
      const result = LoginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('devrait valider une inscription correcte', () => {
      const validRegister = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };
      const result = RegisterSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un nom trop court', () => {
      const invalidRegister = {
        name: 'J',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };
      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProductSchema', () => {
    it('devrait valider un produit correct', () => {
      const validProduct = {
        name: 'Montre de luxe',
        slug: 'montre-de-luxe',
        description: 'Belle montre automatique de haute qualité',
        price: 199.99,
        costPrice: 99.99,
        category: '507f1f77bcf86cd799439011',
        images: ['https://example.com/image1.jpg'],
        stock: 10,
      };
      const result = CreateProductSchema.safeParse(validProduct);
      if (!result.success) {
        console.log('Erreurs:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un prix négatif', () => {
      const invalidProduct = {
        name: 'Montre de luxe',
        slug: 'montre-de-luxe',
        description: 'Belle montre de qualité',
        price: -50,
        costPrice: 30,
        category: '507f1f77bcf86cd799439011',
        images: ['https://example.com/image1.jpg'],
        stock: 10,
      };
      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom trop court', () => {
      const invalidProduct = {
        name: 'Mo',
        description: 'Belle montre',
        price: 199.99,
        costPrice: 99.99,
        categoryId: '507f1f77bcf86cd799439011',
        images: ['https://example.com/image1.jpg'],
        stock: 10,
      };
      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un stock négatif', () => {
      const invalidProduct = {
        name: 'Montre de luxe',
        description: 'Belle montre',
        price: 199.99,
        costPrice: 99.99,
        categoryId: '507f1f77bcf86cd799439011',
        images: ['https://example.com/image1.jpg'],
        stock: -5,
      };
      const result = CreateProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('ShippingAddressSchema', () => {
    it('devrait valider une adresse correcte', () => {
      const validAddress = {
        fullName: 'John Doe',
        address: '123 Main Street',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '+33612345678',
      };
      const result = ShippingAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une adresse sans nom', () => {
      const invalidAddress = {
        address: '123 Main Street',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '+33612345678',
      };
      const result = ShippingAddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCouponSchema', () => {
    it('devrait valider un coupon pourcentage correct', () => {
      const validCoupon = {
        code: 'SUMMER2026',
        type: 'percentage',
        value: 20,
        minPurchase: 50,
        usageLimit: 100,
        expiresAt: new Date('2026-12-31').toISOString(),
      };
      const result = CreateCouponSchema.safeParse(validCoupon);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une valeur négative', () => {
      const invalidCoupon = {
        code: 'INVALID',
        type: 'percentage',
        value: -10,
        minPurchase: 0,
        expiresAt: new Date('2026-12-31').toISOString(),
      };
      const result = CreateCouponSchema.safeParse(invalidCoupon);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un code trop court', () => {
      const invalidCoupon = {
        code: 'AB',
        type: 'percentage',
        value: 20,
        minPurchase: 0,
        expiresAt: new Date('2026-12-31').toISOString(),
      };
      const result = CreateCouponSchema.safeParse(invalidCoupon);
      expect(result.success).toBe(false);
    });
  });
});
