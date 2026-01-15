import 'dotenv/config';
import { createClient } from './client';
import {
  tenants,
  companies,
  documents,
  documentEvents,
  nsuControl,
  agents,
  auditLogs,
} from './schema/index';

async function seed() {
  console.log('🌱 Starting database seed...');
  console.log('⚠️  This will create demo data for development.\n');

  const db = createClient();

  // ============================================
  // 0. Clear existing data (for re-seeding)
  // ============================================
  console.log('🧹 Clearing existing data...');
  await db.delete(auditLogs);
  await db.delete(documentEvents);
  await db.delete(documents);
  await db.delete(nsuControl);
  await db.delete(agents);
  await db.delete(companies);
  await db.delete(tenants);
  console.log('   ✅ Database cleared\n');

  // ============================================
  // 1. Create Demo Tenant
  // ============================================
  console.log('📦 Creating tenant...');
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'Contabilidade Demo Ltda',
      cnpj: '12345678000190',
      plan: 'professional',
      settings: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        notifications: {
          email: true,
          slack: false,
        },
      },
    })
    .returning();

  console.log(`   ✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ============================================
  // 2. Create Demo Companies
  // ============================================
  console.log('\n📦 Creating companies...');
  const demoCompanies = [
    {
      tenantId: tenant.id,
      cnpj: '11222333000144',
      razaoSocial: 'Empresa Exemplo Ltda',
      nomeFantasia: 'Exemplo',
      uf: 'SP',
      inscricaoEstadual: '123456789012',
      inscricaoMunicipal: '12345678',
      codigoMunicipio: '3550308', // São Paulo
      settings: {
        monitorNfe: true,
        monitorCte: true,
        monitorMdfe: false,
        monitorNfse: true,
      },
    },
    {
      tenantId: tenant.id,
      cnpj: '55666777000188',
      razaoSocial: 'Comércio ABC Ltda',
      nomeFantasia: 'ABC Store',
      uf: 'RJ',
      inscricaoEstadual: '987654321098',
      inscricaoMunicipal: '87654321',
      codigoMunicipio: '3304557', // Rio de Janeiro
      settings: {
        monitorNfe: true,
        monitorCte: false,
        monitorMdfe: false,
        monitorNfse: true,
      },
    },
    {
      tenantId: tenant.id,
      cnpj: '99888777000166',
      razaoSocial: 'Indústria XYZ S.A.',
      nomeFantasia: 'XYZ Industrial',
      uf: 'MG',
      inscricaoEstadual: '456789123456',
      codigoMunicipio: '3106200', // Belo Horizonte
      settings: {
        monitorNfe: true,
        monitorCte: true,
        monitorMdfe: true,
        monitorNfse: false,
      },
    },
  ];

  const insertedCompanies = await db.insert(companies).values(demoCompanies).returning();
  insertedCompanies.forEach((c) => {
    console.log(`   ✅ Company: ${c.razaoSocial} (${c.cnpj})`);
  });

  // ============================================
  // 3. Create NSU Control entries
  // ============================================
  console.log('\n📦 Creating NSU control entries...');
  const nsuEntries = [];
  for (const company of insertedCompanies) {
    const companySettings = company.settings as Record<string, boolean> | null;

    // NFE control for all companies
    if (companySettings?.monitorNfe !== false) {
      nsuEntries.push({
        companyId: company.id,
        docType: 'NFE' as const,
        lastNsu: '000000000000000',
        syncStatus: 'idle' as const,
      });
    }

    // CTE control (if enabled)
    if (companySettings?.monitorCte) {
      nsuEntries.push({
        companyId: company.id,
        docType: 'CTE' as const,
        lastNsu: '000000000000000',
        syncStatus: 'idle' as const,
      });
    }

    // MDFE control (if enabled)
    if (companySettings?.monitorMdfe) {
      nsuEntries.push({
        companyId: company.id,
        docType: 'MDFE' as const,
        lastNsu: '000000000000000',
        syncStatus: 'idle' as const,
      });
    }
  }

  const insertedNsu = await db.insert(nsuControl).values(nsuEntries).returning();
  console.log(`   ✅ Created ${insertedNsu.length} NSU control entries`);

  // ============================================
  // 4. Create Sample Documents
  // ============================================
  console.log('\n📦 Creating sample documents...');
  const sampleDocs = [
    // NFe examples
    {
      tenantId: tenant.id,
      companyId: insertedCompanies[0].id,
      docType: 'NFE' as const,
      chave: '35240111222333000144550010000001231234567890',
      numero: 123,
      serie: 1,
      emitCnpj: '98765432000111',
      emitRazao: 'Fornecedor Alpha Ltda',
      destCnpjCpf: '11222333000144',
      destRazao: 'Empresa Exemplo Ltda',
      valorTotal: '15750.50',
      dataEmissao: '2024-12-15',
      dataAutorizacao: new Date('2024-12-15T10:30:00-03:00'),
      dataCaptura: new Date('2024-12-15T11:00:00-03:00'),
      situacao: 'autorizada' as const,
      xmlStorageKey: 'nfe/2024/12/35240111222333000144550010000001231234567890.xml',
      xmlHashSha256: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234',
      xmlSizeBytes: 45678,
      metadata: {
        natOp: 'VENDA DE MERCADORIA',
        tpNF: '1',
        protocolo: '135240000123456',
      },
      searchContent: 'Fornecedor Alpha Ltda 98765432000111 Empresa Exemplo Ltda 11222333000144 VENDA DE MERCADORIA',
    },
    {
      tenantId: tenant.id,
      companyId: insertedCompanies[0].id,
      docType: 'NFE' as const,
      chave: '35240111222333000144550010000001241234567891',
      numero: 124,
      serie: 1,
      emitCnpj: '11223344000155',
      emitRazao: 'Distribuidor Beta S.A.',
      destCnpjCpf: '11222333000144',
      destRazao: 'Empresa Exemplo Ltda',
      valorTotal: '8920.00',
      dataEmissao: '2024-12-18',
      dataAutorizacao: new Date('2024-12-18T14:20:00-03:00'),
      dataCaptura: new Date('2024-12-18T15:00:00-03:00'),
      situacao: 'autorizada' as const,
      xmlStorageKey: 'nfe/2024/12/35240111222333000144550010000001241234567891.xml',
      xmlHashSha256: 'b2c3d4e5f67890123456789012345678901abcdef2345678901abcdef2345',
      xmlSizeBytes: 52341,
      metadata: {
        natOp: 'COMPRA PARA COMERCIALIZACAO',
        tpNF: '0',
        protocolo: '135240000123789',
      },
      searchContent: 'Distribuidor Beta S.A. 11223344000155 Empresa Exemplo Ltda 11222333000144 COMPRA PARA COMERCIALIZACAO',
    },
    // CTe example
    {
      tenantId: tenant.id,
      companyId: insertedCompanies[2].id,
      docType: 'CTE' as const,
      chave: '31240199888777000166570010000005671234567892',
      numero: 567,
      serie: 1,
      emitCnpj: '33445566000177',
      emitRazao: 'Transportadora Gamma Ltda',
      destCnpjCpf: '99888777000166',
      destRazao: 'Indústria XYZ S.A.',
      valorTotal: '2500.00',
      dataEmissao: '2024-12-20',
      dataAutorizacao: new Date('2024-12-20T09:15:00-03:00'),
      dataCaptura: new Date('2024-12-20T10:00:00-03:00'),
      situacao: 'autorizada' as const,
      xmlStorageKey: 'cte/2024/12/31240199888777000166570010000005671234567892.xml',
      xmlHashSha256: 'c3d4e5f678901234567890123456789012abcdef3456789012abcdef3456',
      xmlSizeBytes: 38921,
      metadata: {
        modal: '01', // Rodoviário
        tpServ: '0', // Normal
        protocolo: '131240000456123',
      },
      searchContent: 'Transportadora Gamma Ltda 33445566000177 Indústria XYZ S.A. 99888777000166 TRANSPORTE RODOVIARIO',
    },
    // NFSe example
    {
      tenantId: tenant.id,
      companyId: insertedCompanies[1].id,
      docType: 'NFSE' as const,
      chave: null,
      numero: 1001,
      serie: 0,
      emitCnpj: '77889900000111',
      emitRazao: 'Consultoria Delta Ltda',
      destCnpjCpf: '55666777000188',
      destRazao: 'Comércio ABC Ltda',
      valorTotal: '5000.00',
      dataEmissao: '2024-12-22',
      dataAutorizacao: new Date('2024-12-22T16:45:00-03:00'),
      dataCaptura: new Date('2024-12-22T17:00:00-03:00'),
      situacao: 'autorizada' as const,
      xmlStorageKey: 'nfse/2024/12/RJ-3304557-1001.xml',
      xmlHashSha256: 'd4e5f6789012345678901234567890123abcdef4567890123abcdef4567',
      xmlSizeBytes: 12456,
      metadata: {
        codigoServico: '1.05',
        discriminacao: 'Consultoria em tecnologia da informação',
        municipio: 'Rio de Janeiro',
        codigoVerificacao: 'ABC123DEF',
      },
      searchContent: 'Consultoria Delta Ltda 77889900000111 Comércio ABC Ltda 55666777000188 Consultoria em tecnologia da informação',
    },
    // Cancelled NFe
    {
      tenantId: tenant.id,
      companyId: insertedCompanies[0].id,
      docType: 'NFE' as const,
      chave: '35240111222333000144550010000001201234567893',
      numero: 120,
      serie: 1,
      emitCnpj: '44556677000199',
      emitRazao: 'Fornecedor Epsilon Ltda',
      destCnpjCpf: '11222333000144',
      destRazao: 'Empresa Exemplo Ltda',
      valorTotal: '3200.00',
      dataEmissao: '2024-12-10',
      dataAutorizacao: new Date('2024-12-10T11:00:00-03:00'),
      dataCaptura: new Date('2024-12-10T12:00:00-03:00'),
      situacao: 'cancelada' as const,
      xmlStorageKey: 'nfe/2024/12/35240111222333000144550010000001201234567893.xml',
      xmlHashSha256: 'e5f67890123456789012345678901234abcdef5678901234abcdef5678',
      xmlSizeBytes: 41234,
      metadata: {
        natOp: 'VENDA DE MERCADORIA',
        tpNF: '1',
        protocolo: '135240000121000',
        motivoCancelamento: 'Erro no preenchimento',
      },
      searchContent: 'Fornecedor Epsilon Ltda 44556677000199 Empresa Exemplo Ltda 11222333000144 CANCELADA',
    },
  ];

  const insertedDocs = await db.insert(documents).values(sampleDocs).returning();
  console.log(`   ✅ Created ${insertedDocs.length} sample documents`);

  // ============================================
  // 5. Create Document Events
  // ============================================
  console.log('\n📦 Creating document events...');
  const cancelledDoc = insertedDocs.find((d) => d.situacao === 'cancelada');
  const events = [];

  if (cancelledDoc) {
    events.push({
      documentId: cancelledDoc.id,
      eventType: 'CANCELAMENTO',
      eventSeq: 1,
      eventDate: new Date('2024-12-10T15:00:00-03:00'),
      protocol: '135240000121001',
      description: 'Cancelamento de NF-e',
      xmlStorageKey: 'eventos/2024/12/cancel-35240111222333000144550010000001201234567893.xml',
      metadata: {
        justificativa: 'Erro no preenchimento dos dados do destinatário',
        nProt: '135240000121001',
      },
    });
  }

  // Add manifestation event for first NFe
  const firstNfe = insertedDocs[0];
  events.push({
    documentId: firstNfe.id,
    eventType: 'CIENCIA',
    eventSeq: 1,
    eventDate: new Date('2024-12-15T12:00:00-03:00'),
    protocol: '135240000123457',
    description: 'Ciência da Operação',
    metadata: {
      tpEvento: '210210',
      descEvento: 'Ciencia da Operacao',
    },
  });

  if (events.length > 0) {
    const insertedEvents = await db.insert(documentEvents).values(events).returning();
    console.log(`   ✅ Created ${insertedEvents.length} document events`);
  }

  // ============================================
  // 6. Create Sample Agent
  // ============================================
  console.log('\n📦 Creating sample agent...');
  const [agent] = await db
    .insert(agents)
    .values({
      tenantId: tenant.id,
      name: 'Agente Escritório Principal',
      machineId: 'DESKTOP-ABC123-001',
      version: '1.0.0',
      status: 'offline',
      ipAddress: '192.168.1.100',
      config: {
        watchFolders: ['C:\\SAT\\Envio', 'C:\\NFCe\\XML'],
        autoUpload: true,
        syncInterval: 300,
      },
    })
    .returning();

  console.log(`   ✅ Agent: ${agent.name} (${agent.machineId})`);

  // ============================================
  // 7. Create Audit Log Entry
  // ============================================
  console.log('\n📦 Creating audit log entry...');
  await db.insert(auditLogs).values({
    tenantId: tenant.id,
    action: 'SEED_DATABASE',
    entityType: 'system',
    details: {
      message: 'Database seeded with demo data',
      companiesCreated: insertedCompanies.length,
      documentsCreated: insertedDocs.length,
    },
  });

  console.log('   ✅ Audit log entry created');

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed completed successfully!');
  console.log('='.repeat(50));
  console.log('\nSummary:');
  console.log(`   • 1 Tenant: ${tenant.name}`);
  console.log(`   • ${insertedCompanies.length} Companies`);
  console.log(`   • ${insertedNsu.length} NSU Control entries`);
  console.log(`   • ${insertedDocs.length} Documents (NFe, CTe, NFSe)`);
  console.log(`   • ${events.length} Document Events`);
  console.log(`   • 1 Agent`);
  console.log('\nYou can now start the API and Frontend to explore the demo data.');

  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
