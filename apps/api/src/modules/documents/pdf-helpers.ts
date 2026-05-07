type SupportedPdfDocumentType = 'NFE' | 'NFCE' | 'CTE';

export function isPdfSupportedDocumentType(docType: string): docType is SupportedPdfDocumentType {
  return docType === 'NFE' || docType === 'NFCE' || docType === 'CTE';
}

export function getPdfRepresentation(docType: SupportedPdfDocumentType) {
  if (docType === 'CTE') {
    return 'DACTE';
  }

  return 'DANFE';
}

export function buildPdfFilename(document: {
  id: string;
  chave: string | null;
  docType: string;
}) {
  const identifier = document.chave || document.id;

  if (document.docType === 'CTE') {
    return `CTe_${identifier}.pdf`;
  }

  if (document.docType === 'NFE' || document.docType === 'NFCE') {
    return `NFe_${identifier}.pdf`;
  }

  return `DocumentoFiscal_${document.id}.pdf`;
}

export function buildXmlFilename(document: {
  id: string;
  chave: string | null;
  docType: string;
}) {
  const identifier = document.chave || document.id;

  if (document.docType === 'CTE') {
    return `CTe_${identifier}.xml`;
  }

  if (document.docType === 'NFE' || document.docType === 'NFCE') {
    return `NFe_${identifier}.xml`;
  }

  return `DocumentoFiscal_${document.id}.xml`;
}
