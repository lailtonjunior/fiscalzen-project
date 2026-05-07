export function serializePublicDocument(document: Record<string, unknown>) {
  const { xmlStorageKey, pdfStorageKey, xmlHashSha256, ...publicDocument } = document as Record<
    string,
    unknown
  > & {
    xmlStorageKey?: string | null;
    pdfStorageKey?: string | null;
    xmlHashSha256?: string | null;
  };

  void xmlHashSha256;

  return Object.assign(publicDocument, {
    hasXml: Boolean(xmlStorageKey),
    hasPdf: Boolean(pdfStorageKey),
  });
}
