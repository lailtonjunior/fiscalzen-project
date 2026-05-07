export function sanitizeDownloadResult(
  result: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!result) {
    return null;
  }

  const { storageKey, downloadUrl, ...publicResult } = result;
  void storageKey;
  void downloadUrl;

  return publicResult;
}
