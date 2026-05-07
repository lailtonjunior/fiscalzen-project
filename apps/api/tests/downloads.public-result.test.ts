import { describe, expect, it } from 'vitest';
import { sanitizeDownloadResult } from '../src/modules/downloads/public-result';

describe('sanitizeDownloadResult', () => {
  it('removes storage and presigned URL details from public download payloads', () => {
    expect(
      sanitizeDownloadResult({
        success: true,
        processed: 8,
        errors: 1,
        storageKey: 'tenant/downloads/file.zip',
        downloadUrl: 'https://signed.example/file.zip',
      })
    ).toEqual({
      success: true,
      processed: 8,
      errors: 1,
    });
  });

  it('keeps nullish payloads untouched', () => {
    expect(sanitizeDownloadResult(null)).toBeNull();
    expect(sanitizeDownloadResult(undefined)).toBeNull();
  });
});
