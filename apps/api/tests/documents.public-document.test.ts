import { describe, expect, it } from 'vitest';
import { serializePublicDocument } from '../src/modules/documents/public-document';

describe('serializePublicDocument', () => {
  it('removes internal storage fields and exposes public availability flags', () => {
    const serialized = serializePublicDocument({
      id: 'doc-1',
      chave: '123',
      xmlStorageKey: 'tenant/company/NFE/file.xml',
      pdfStorageKey: 'tenant/company/NFE/file.pdf',
      xmlHashSha256: 'secret-hash',
    });

    expect(serialized).toEqual({
      id: 'doc-1',
      chave: '123',
      hasXml: true,
      hasPdf: true,
    });
    expect(serialized).not.toHaveProperty('xmlStorageKey');
    expect(serialized).not.toHaveProperty('pdfStorageKey');
    expect(serialized).not.toHaveProperty('xmlHashSha256');
  });
});
