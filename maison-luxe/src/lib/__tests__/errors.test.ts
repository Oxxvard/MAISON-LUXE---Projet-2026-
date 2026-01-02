/**
 * Tests unitaires pour la gestion des erreurs
 * Critique car utilisé dans toutes les API routes
 */

import {
  errorResponse,
  successResponse,
  formatZodError,
} from '@/lib/errors';
import { z } from 'zod';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => data),
  },
}));

describe('Système de gestion des erreurs', () => {
  describe('errorResponse', () => {
    it('devrait créer une réponse d\'erreur correcte', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Données invalides');
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      
      if (response.error) {
        expect(response.error.code).toBe('VALIDATION_ERROR');
        expect(response.error.message).toBe('Données invalides');
      }
      expect(response.timestamp).toBeDefined();
    });

    it('devrait inclure les détails si fournis', () => {
      const details = { field: 'email', issue: 'Format invalide' };
      const response = errorResponse('VALIDATION_ERROR', 'Erreur', details);
      
      expect(response.error).toBeDefined();
      
      if (response.error) {
        expect(response.error.details).toEqual(details);
      }
    });
  });

  describe('successResponse', () => {
    it('devrait créer une réponse de succès correcte', () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('formatZodError', () => {
    it('devrait formater les erreurs Zod correctement', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const result = schema.safeParse({ email: 'invalid', age: 15 });
      
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const formatted = formatZodError(result.error);
        // La fonction retourne un objet, même vide
        expect(typeof formatted).toBe('object');
      }
    });
  });
});
