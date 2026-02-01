/**
 * SEFAZ Mock Server (MSW)
 * 
 * Intercepts calls to SEFAZ/Sefaz Virtual services.
 */
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const sefazServer = setupServer(
    // Mock 'NfeAutorizacao' or generic SEFAZ endpoints
    http.post('https://hom.sefaz*.gov.br/*', () => {
        return HttpResponse.xml(`
      <soap:Envelope>
        <soap:Body>
          <nfeResultMsg>
            <retEnviNFe>
                <cStat>103</cStat>
                <xMotivo>Lote recebido com sucesso</xMotivo>
            </retEnviNFe>
          </nfeResultMsg>
        </soap:Body>
      </soap:Envelope>
    `);
    }),

    // Mock generic Status Service
    http.get('https://*/status', () => {
        return HttpResponse.json({ status: 'online' });
    })
);
