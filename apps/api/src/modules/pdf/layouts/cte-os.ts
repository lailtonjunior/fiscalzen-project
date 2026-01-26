import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { CTeData } from '@fiscalzen/xml-parser';
import { getCTeLayout, type DacteLayoutOptions } from './cte';

// ============================================
// DACTE OS - CTe de Servico (Modelo 67)
// Reutiliza layout base do DACTE com ajustes
// ============================================

export async function getCTeOsLayout(
  data: CTeData,
  options: DacteLayoutOptions
): Promise<TDocumentDefinitions> {
  // CTe OS (modelo 67) tem layout muito similar ao CTe normal (modelo 57)
  // A principal diferenca e no titulo e em alguns campos especificos
  const baseLayout = await getCTeLayout(data, options);

  // Ajustar titulo para DACTE OS
  if (baseLayout.content && Array.isArray(baseLayout.content)) {
    const header = baseLayout.content[0] as any;
    if (header?.table?.body?.[0]?.[1]?.stack) {
      header.table.body[0][1].stack[0].text = 'DACTE OS';
      header.table.body[0][1].stack[1].text = 'Documento Auxiliar do';
      header.table.body[0][1].stack[2].text = 'CT-e de Outros';
      header.table.body[0][1].stack[3].text = 'Servicos';
    }
  }

  return baseLayout;
}
