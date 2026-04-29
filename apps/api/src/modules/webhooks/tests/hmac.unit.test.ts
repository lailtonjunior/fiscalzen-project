import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookService } from '../service';
import crypto from 'crypto';

describe('WebhookService - HMAC Verification', () => {
    let webhookService: WebhookService;
    const dummyDb = {} as any; // Db mockado pois não vamos usar métodos de banco aqui

    beforeEach(() => {
        webhookService = new WebhookService(dummyDb);
    });

    it('deve retornar true quando a assinatura HMAC for valida', () => {
        const secret = 'minha-chave-secreta-muito-segura-123';
        const payload = { evento: 'nfe.autorizada', valor: 1000 };
        
        // Geramos uma assinatura válida (simulando a própria geração)
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        const validSignature = `sha256=${hmac.digest('hex')}`;

        // Act - chamando método que testará se a assinatura bate com timingSafeEqual
        // (Isso falhará inicialmente porque verifySignature não existe)
        const isValid = (webhookService as any).verifySignature(payload, validSignature, secret);
        
        expect(isValid).toBe(true);
    });

    it('deve retornar false quando a assinatura for invalida', () => {
        const secret = 'minha-chave-secreta-muito-segura-123';
        const payload = { evento: 'nfe.autorizada', valor: 1000 };
        
        const invalidSignature = 'sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

        const isValid = (webhookService as any).verifySignature(payload, invalidSignature, secret);
        
        expect(isValid).toBe(false);
    });

    it('deve retornar false quando o tamanho dos buffers diferir sem lancar excecao', () => {
        const secret = 'minha-chave-secreta-muito-segura-123';
        const payload = { evento: 'nfe.autorizada', valor: 1000 };
        
        // Assinatura de tamanho distinto (pode causar exceção no timingSafeEqual nativo se não tratado)
        const invalidShortSignature = 'sha256=abc';

        expect(() => {
            const isValid = (webhookService as any).verifySignature(payload, invalidShortSignature, secret);
            expect(isValid).toBe(false);
        }).not.toThrow();
    });
});
