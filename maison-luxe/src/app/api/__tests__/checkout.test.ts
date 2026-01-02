/**
 * Tests pour la logique de validation checkout
 * Teste la validation des données de checkout
 */

import { ShippingAddressSchema } from '@/lib/schemas';

describe('Checkout Validation Logic', () => {
  describe('ShippingAddressSchema', () => {
    it('devrait accepter une adresse de livraison valide', () => {
      const validAddress = {
        fullName: 'John Doe',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '+33612345678',
      };

      const result = ShippingAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('devrait accepter une adresse avec province optionnelle', () => {
      const validAddress = {
        fullName: 'John Doe',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '+33612345678',
        province: 'Île-de-France',
      };

      const result = ShippingAddressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un nom complet vide', () => {
      const invalidAddress = {
        fullName: '',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '+33612345678',
      };

      const result = ShippingAddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une adresse vide', () => {
      const invalidAddress = {
        fullName: 'John Doe',
        address: '',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '+33612345678',
      };

      const result = ShippingAddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une ville vide', () => {
      const invalidAddress = {
        fullName: 'John Doe',
        address: '123 Rue de la Paix',
        city: '',
        postalCode: '75001',
        country: 'FR',
        phone: '+33612345678',
      };

      const result = ShippingAddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un code postal vide', () => {
      const invalidAddress = {
        fullName: 'John Doe',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '',
        country: 'FR',
        phone: '+33612345678',
      };

      const result = ShippingAddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });

    it('devrait valider le code pays ISO (2 lettres)', () => {
      const invalidAddress = {
        fullName: 'John Doe',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FRA', // Devrait être FR (2 lettres)
        phone: '+33612345678',
      };

      const result = ShippingAddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un numéro de téléphone vide', () => {
      const invalidAddress = {
        fullName: 'John Doe',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '',
      };

      const result = ShippingAddressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });
  });
});
