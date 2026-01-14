/**
 * Build a SOAP envelope for SEFAZ web services
 */
export function buildSoapEnvelope(action: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header/>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      ${body}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
}

/**
 * Extract the body content from a SOAP response
 */
export function extractSoapBody(xml: string): string {
  // Try different body patterns
  const patterns = [
    /<soap:Body>([\s\S]*?)<\/soap:Body>/i,
    /<soap12:Body>([\s\S]*?)<\/soap12:Body>/i,
    /<S:Body>([\s\S]*?)<\/S:Body>/i,
    /<env:Body>([\s\S]*?)<\/env:Body>/i,
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If no body tag found, return original
  return xml;
}

/**
 * Extract a specific element from XML response
 */
export function extractElement(xml: string, elementName: string): string | null {
  const pattern = new RegExp(`<${elementName}[^>]*>([\\s\\S]*?)<\\/${elementName}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1] : null;
}
