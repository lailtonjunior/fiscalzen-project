/**
 * Comando: manifestar
 * Envia manifestação do destinatário (NFeRecepcaoEvento)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    confirmarOperacao,
    registrarCiencia,
    desconhecerOperacao,
    operacaoNaoRealizada,
    type SefazAmbiente,
    type CertificadoA1,
    type ManifestacaoResponse,
    type TipoEventoManifestacao,
} from '@fiscalzen/sefaz-client';

interface ManifestarOptions {
    cert: string;
    senha: string;
    chave: string;
    tipo: string;
    ambiente: string;
    justificativa?: string;
    json?: boolean;
}

const TIPO_MAP: Record<string, TipoEventoManifestacao> = {
    'ciencia': '210210',
    'confirmacao': '210200',
    'desconhecimento': '210220',
    'nao-realizada': '210240',
};

export async function manifestar(options: ManifestarOptions): Promise<void> {
    try {
        // Validar chave de acesso
        if (!/^\d{44}$/.test(options.chave)) {
            throw new Error('Chave de acesso deve ter 44 dígitos');
        }

        // Validar tipo de manifestação
        const tipoEvento = TIPO_MAP[options.tipo];
        if (!tipoEvento) {
            throw new Error(`Tipo inválido: ${options.tipo}. Use: ciencia, confirmacao, desconhecimento, nao-realizada`);
        }

        // Validar justificativa para operação não realizada
        if (tipoEvento === '210240') {
            if (!options.justificativa) {
                throw new Error('Justificativa é obrigatória para "nao-realizada"');
            }
            if (options.justificativa.length < 15 || options.justificativa.length > 255) {
                throw new Error('Justificativa deve ter entre 15 e 255 caracteres');
            }
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

        // Extrair CNPJ do destinatário da chave (posições 6-19)
        const cnpjDestinatario = options.chave.substring(6, 20);

        log(options, `Enviando manifestação: ${options.tipo}`);
        log(options, `Chave: ${options.chave.substring(0, 10)}...`);

        let response: ManifestacaoResponse;

        // Executar a manifestação apropriada
        switch (tipoEvento) {
            case '210200':
                response = await confirmarOperacao(
                    ambiente,
                    options.chave,
                    cnpjDestinatario,
                    certificado
                );
                break;
            case '210210':
                response = await registrarCiencia(
                    ambiente,
                    options.chave,
                    cnpjDestinatario,
                    certificado
                );
                break;
            case '210220':
                response = await desconhecerOperacao(
                    ambiente,
                    options.chave,
                    cnpjDestinatario,
                    certificado
                );
                break;
            case '210240':
                response = await operacaoNaoRealizada(
                    ambiente,
                    options.chave,
                    cnpjDestinatario,
                    certificado,
                    options.justificativa!
                );
                break;
            default:
                throw new Error(`Tipo de evento não suportado: ${tipoEvento}`);
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

function printResponse(response: ManifestacaoResponse): void {
    console.log('\n═══════════════════════════════════════════');
    console.log('  FiscalZen - Manifestação do Destinatário');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Status: ${response.sucesso ? '✓ Sucesso' : '✗ Erro'}`);
    console.log(`Código: ${response.cStat}`);
    console.log(`Motivo: ${response.xMotivo}`);
    console.log(`Evento: ${response.descricaoEvento}`);
    console.log(`Sequência: ${response.sequencia}`);

    if (response.nProt) {
        console.log(`\n✓ Protocolo: ${response.nProt}`);
    }

    if (response.dhRegEvento) {
        console.log(`Registrado em: ${new Date(response.dhRegEvento).toLocaleString('pt-BR')}`);
    }

    if (response.erro) {
        console.log(`\nErro: [${response.erro.codigo}] ${response.erro.mensagem}`);
    }

    console.log('');
}

function log(options: ManifestarOptions, message: string): void {
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
