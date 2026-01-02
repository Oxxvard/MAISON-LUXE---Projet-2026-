/**
 * Tests pour la logique de validation auth
 * Teste les schemas et la logique sans appeler directement les routes
 */

import { RegisterSchema, LoginSchema } from '@/lib/schemas';

describe('Authentication Logic', () => {
  describe('RegisterSchema Validation', () => {
    it('devrait accepter des données d\'inscription valides', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@1234',
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un email invalide', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Test@1234',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop court', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe sans caractère spécial', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un nom vide', () => {
      const invalidData = {
        name: '',
        email: 'john@example.com',
        password: 'Test@1234',
      };

      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema Validation', () => {
    it('devrait accepter des credentials valides', () => {
      const validData = {
        email: 'john@example.com',
        password: 'Test@1234',
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un email invalide', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Test@1234',
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un mot de passe trop court', () => {
      const invalidData = {
        email: 'john@example.com',
        password: 'short',
      };

      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
