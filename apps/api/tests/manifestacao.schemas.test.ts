import { describe, expect, it } from 'vitest';
import {
  manifestacaoSubmitSchema,
  manifestacaoHistoryQuerySchema,
} from '../src/modules/manifestacao/schemas';

describe('manifestacao schemas', () => {
  it('requires justificativa for operacao nao realizada', () => {
    const result = manifestacaoSubmitSchema.safeParse({
      tipo: '210240',
    });

    expect(result.success).toBe(false);
  });

  it('accepts confirmacao without justificativa', () => {
    const result = manifestacaoSubmitSchema.safeParse({
      tipo: '210200',
    });

    expect(result.success).toBe(true);
  });

  it('applies defaults to history query pagination', () => {
    const result = manifestacaoHistoryQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});
