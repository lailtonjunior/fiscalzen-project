/**
 * Comando: consultar
 * Consulta documentos fiscais via NFeDistribuicaoDFe
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    consultarPorUltNSU,
    consultarPorNSU,
    consultarPorChave,
    type SefazAmbiente,
    type CertificadoA1,
    type DistDFeResponse,
} from '@fiscalzen/sefaz-client';

interface ConsultarOptions {
    cert: string;
    senha: string;
    cnpj: string;
    ambiente: string;
    ultNSU?: string;
    nsu?: string;
    chave?: string;
    uf?: string;
    json?: boolean;
}

export async function consultar(options: ConsultarOptions): Promise<void> {
    try {
        // Validar CNPJ
        if (!/^\d{14}$/.test(options.cnpj)) {
            throw new Error('CNPJ deve ter 14 dígitos');
        }

        // Carregar certificado
        const certPath = path.resolve(options.cert);
        if (!fs.existsSync(certPath)) {
            throw new Error(`Certificado não encontrado: ${certPath}`);
        }

        const pfxBuffer = fs.readFileSync(certPath);
        const certificado: CertificadoA1 = {
            pfxBuffer,
            password: options.senha,
        };

        const ambiente = options.ambiente as SefazAmbiente;
        const ufAutor = options.uf ? parseInt(options.uf, 10) : undefined;

        let response: DistDFeResponse;

        // Determinar tipo de consulta
        if (options.chave) {
            // Consulta por chave de acesso
            if (!/^\d{44}$/.test(options.chave)) {
                throw new Error('Chave de acesso deve ter 44 dígitos');
            }

            log(options, `Consultando por chave: ${options.chave.substring(0, 10)}...`);
            response = await consultarPorChave(
                ambiente,
                options.cnpj,
                options.chave,
                certificado,
                ufAutor
            );
        } else if (options.nsu) {
            // Consulta NSU específico
            log(options, `Consultando NSU: ${options.nsu}`);
            response = await consultarPorNSU(
                ambiente,
                options.cnpj,
                options.nsu,
                certificado,
                ufAutor
            );
        } else {
            // Consulta por último NSU (padrão)
            const ultNSU = options.ultNSU || '0';
            log(options, `Consultando a partir do NSU: ${ultNSU}`);
            response = await consultarPorUltNSU(
                ambiente,
                options.cnpj,
                ultNSU,
                certificado,
                ufAutor
            );
        }

        // Saída
        if (options.json) {
            console.log(JSON.stringify(response, null, 2));
        } else {
            printResponse(response);
        }

        process.exit(response.sucesso ? 0 : 1);
    } catch (error) {
        handleError(error, options.json);
    }
}

function printResponse(response: DistDFeResponse): void {
    console.log('\n═══════════════════════════════════════════');
    console.log('  FiscalZen - Consulta DistDFe');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Status: ${response.sucesso ? '✓ Sucesso' : '✗ Erro'}`);
    console.log(`Código: ${response.cStat}`);
    console.log(`Motivo: ${response.xMotivo}`);
    console.log(`Último NSU: ${response.ultNSU}`);
    console.log(`Máximo NSU: ${response.maxNSU}`);

    if (response.documentos.length > 0) {
        console.log(`\nDocumentos encontrados: ${response.documentos.length}`);
        console.log('───────────────────────────────────────────');

        response.documentos.forEach((doc, idx) => {
            console.log(`\n[${idx + 1}] NSU: ${doc.nsu}`);
            console.log(`    Tipo: ${doc.tipo || 'N/A'}`);
            console.log(`    Schema: ${doc.schema}`);
            console.log(`    Resumo: ${doc.isResumo ? 'Sim' : 'Não'}`);
            console.log(`    Evento: ${doc.isEvento ? 'Sim' : 'Não'}`);
            if (doc.chave) {
                console.log(`    Chave: ${doc.chave}`);
            }
        });
    } else {
        console.log('\nNenhum documento encontrado.');
    }

    if (response.erro) {
        console.log(`\nErro: [${response.erro.codigo}] ${response.erro.mensagem}`);
    }

    console.log('');
}

function log(options: ConsultarOptions, message: string): void {
    if (!options.json) {
        console.log(`[fiscalzen] ${message}`);
    }
}

function handleError(error: unknown, json?: boolean): void {
    const message = error instanceof Error ? error.message : String(error);

    if (json) {
        console.log(JSON.stringify({ sucesso: false, erro: message }));
    } else {
        console.error(`\n✗ Erro: ${message}\n`);
    }

    process.exit(1);
}
