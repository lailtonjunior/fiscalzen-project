/**
 * Comando: validar-cert
 * Valida certificado digital A1 e exibe informações
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    getCertificadoInfo,
    validateCertificado,
    type CertificadoA1,
} from '@fiscalzen/sefaz-client';

interface ValidarCertOptions {
    cert: string;
    senha: string;
    json?: boolean;
}

export async function validarCert(options: ValidarCertOptions): Promise<void> {
    try {
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

        // Obter informações
        const info = getCertificadoInfo(certificado);
        const validation = validateCertificado(certificado);

        const result = {
            valido: validation.valid,
            cnpj: info.cnpj,
            razaoSocial: info.razaoSocial,
            validoDesde: info.validFrom.toISOString(),
            validoAte: info.validTo.toISOString(),
            diasParaExpirar: validation.daysUntilExpiry,
            emissor: info.issuer,
            serial: info.serialNumber,
            thumbprint: info.thumbprint,
            mensagem: validation.message,
        };

        // Saída
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            printResult(result);
        }

        process.exit(validation.valid ? 0 : 1);
    } catch (error) {
        handleError(error, options.json);
    }
}

interface CertResult {
    valido: boolean;
    cnpj: string;
    razaoSocial: string;
    validoDesde: string;
    validoAte: string;
    diasParaExpirar: number;
    emissor: string;
    serial: string;
    thumbprint: string;
    mensagem: string;
}

function printResult(result: CertResult): void {
    console.log('\n═══════════════════════════════════════════');
    console.log('  FiscalZen - Validação de Certificado A1');
    console.log('═══════════════════════════════════════════\n');

    const status = result.valido ? '✓ VÁLIDO' : '✗ INVÁLIDO';
    console.log(`Status: ${status}`);
    console.log(`Mensagem: ${result.mensagem}`);

    console.log('\n─── Dados do Certificado ───────────────────\n');
    console.log(`CNPJ:         ${formatCnpj(result.cnpj)}`);
    console.log(`Razão Social: ${result.razaoSocial}`);
    console.log(`Válido desde: ${formatDate(result.validoDesde)}`);
    console.log(`Válido até:   ${formatDate(result.validoAte)}`);
    console.log(`Dias restantes: ${result.diasParaExpirar}`);

    console.log('\n─── Informações Técnicas ───────────────────\n');
    console.log(`Serial:      ${result.serial}`);
    console.log(`Thumbprint:  ${result.thumbprint}`);
    console.log(`Emissor:     ${result.emissor.substring(0, 60)}...`);

    if (result.diasParaExpirar <= 30 && result.valido) {
        console.log('\n⚠️  ATENÇÃO: Certificado expira em breve!');
    }

    console.log('');
}

function formatCnpj(cnpj: string): string {
    return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function handleError(error: unknown, json?: boolean): void {
    const message = error instanceof Error ? error.message : String(error);

    if (json) {
        console.log(JSON.stringify({ valido: false, erro: message }));
    } else {
        console.error(`\n✗ Erro: ${message}\n`);

        if (message.includes('Mac verify error') || message.includes('password')) {
            console.error('   Verifique se a senha do certificado está correta.\n');
        }
    }

    process.exit(1);
}
