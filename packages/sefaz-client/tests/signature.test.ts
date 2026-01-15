import { describe, it, expect } from 'vitest';
import { gerarEventoId, calculateDigest } from '../src/signature';

describe('Signature Utilities', () => {
  describe('gerarEventoId', () => {
    it('should generate correct ID for manifestacao', () => {
      const chave = '35240112345678000199550010000001231234567890';
      const tipoEvento = '210210';
      const sequencia = 1;

      const id = gerarEventoId(tipoEvento, chave, sequencia);

      expect(id).toBe('ID21021035240112345678000199550010000001231234567890001');
      expect(id).toMatch(/^ID\d{6}\d{44}\d{2}$/);
    });

    it('should pad sequencia to 2 digits', () => {
      const chave = '35240112345678000199550010000001231234567890';

      expect(gerarEventoId('210200', chave, 1)).toContain('01');
      expect(gerarEventoId('210200', chave, 5)).toContain('05');
      expect(gerarEventoId('210200', chave, 10)).toContain('10');
    });
  });

  describe('calculateDigest', () => {
    it('should calculate SHA-1 digest', () => {
      const content = 'Hello World';
      const digest = calculateDigest(content);

      // SHA-1 of "Hello World" in Base64
      expect(digest).toBe('Ck1VqNd45QIvq3AZd8XYQLvEhtA=');
    });

    it('should return different digest for different content', () => {
      const digest1 = calculateDigest('Content 1');
      const digest2 = calculateDigest('Content 2');

      expect(digest1).not.toBe(digest2);
    });
  });
});
