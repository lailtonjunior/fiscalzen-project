#!/usr/bin/env node

/**
 * FiscalZen CLI
 * Ferramenta de linha de comando para consulta e manifestação de documentos fiscais
 */

import { Command } from 'commander';
import { consultar } from './commands/consultar.js';
import { manifestar } from './commands/manifestar.js';
import { validarCert } from './commands/validar-cert.js';

const program = new Command();

program
    .name('fiscalzen')
    .description('CLI para consulta e manifestação de documentos fiscais eletrônicos (SEFAZ)')
    .version('0.1.0');

// Comando: consultar
program
    .command('consultar')
    .description('Consultar documentos fiscais destinados ao CNPJ (DistDFe)')
    .requiredOption('--cert <path>', 'Caminho do certificado A1 (.pfx)')
    .requiredOption('--senha <password>', 'Senha do certificado')
    .requiredOption('--cnpj <cnpj>', 'CNPJ da empresa (14 dígitos)')
    .option('--ambiente <ambiente>', 'Ambiente: homologacao ou producao', 'homologacao')
    .option('--ultNSU <nsu>', 'Último NSU processado (consulta em lote)', '0')
    .option('--nsu <nsu>', 'NSU específico para consulta')
    .option('--chave <chave>', 'Chave de acesso (44 dígitos)')
    .option('--uf <uf>', 'Código UF do autor (ex: 35 para SP)')
    .option('--json', 'Saída em formato JSON')
    .action(consultar);

// Comando: manifestar
program
    .command('manifestar')
    .description('Enviar manifestação do destinatário')
    .requiredOption('--cert <path>', 'Caminho do certificado A1 (.pfx)')
    .requiredOption('--senha <password>', 'Senha do certificado')
    .requiredOption('--chave <chave>', 'Chave de acesso da NF-e (44 dígitos)')
    .requiredOption('--tipo <tipo>', 'Tipo: ciencia, confirmacao, desconhecimento, nao-realizada')
    .option('--ambiente <ambiente>', 'Ambiente: homologacao ou producao', 'homologacao')
    .option('--justificativa <texto>', 'Justificativa (obrigatória para nao-realizada, min 15 chars)')
    .option('--json', 'Saída em formato JSON')
    .action(manifestar);

// Comando: validar-cert
program
    .command('validar-cert')
    .description('Validar certificado digital A1')
    .requiredOption('--cert <path>', 'Caminho do certificado A1 (.pfx)')
    .requiredOption('--senha <password>', 'Senha do certificado')
    .option('--json', 'Saída em formato JSON')
    .action(validarCert);

program.parse();
