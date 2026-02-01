# Glossary & Domain Concepts

This document outlines key terms, acronyms, domain entities, and personas relevant to the project. It also includes type definitions, enumerations, core terms, and domain rules.

## Glossary & Domain Concepts

- **NFSe**: Nota Fiscal de Serviço Eletrônica, a digital invoice used for service taxation.
- **Abrasf**: Associação Brasileira das Secretarias de Finanças das Capitais, responsible for digital invoice standards.
- **SEFAZ**: Secretaria da Fazenda, a state tax authority involved in electronic document management.
- **Municipio**: Refers to a city or town, often linked with NFSe and specific implementation rules.
- **Certificate**: Digital certificates used for electronic document authentication.
- **Persona**: Users interacting with the system, including business clients and tax authorities.

## Type Definitions

- **[CertificadoA1](packages\sefaz-client\src\types.ts:9)**: Interface representing a digital certificate used in authentication.
- **[PdfGeneratorConfig](packages\pdf-generator\src\types.ts:3)**: Configuration for PDF generation services.
- **[MunicipioEndpoints](packages\nfse-client\src\types.ts:8)**: Configuration for city-specific endpoints.

## Enumerations

- **[DocType](packages\xml-parser\src\types.ts:6)**: Enum specifying document types, such as invoices.
- **[XmlSchemaType](packages\xml-parser\src\types.ts:28)**: Enum representing XML schema variations.
- **[SefazAmbiente](packages\sefaz-client\src\types.ts:7)**: Enum for different SEFAZ environments, like production and testing.

## Core Terms

- **Nota Fiscal**: A key digital document managed within the codebase for taxation purposes.
- **SOAP Envelope**: An XML structure for exchanging information in web services, frequently appearing in client-server interactions.
- **Digital Signature**: A crucial component for document security and integrity, implemented across modules.

## Acronyms & Abbreviations

- **NFSe**: Nota Fiscal de Serviço Eletrônica, integrated into municipal tax portals.
- **SEFAZ**: Secretaria da Fazenda, governing state taxation applications.

## Personas / Actors

The key users of this system include:

- **Business Clients**: Require efficient management of invoices for compliance and logistical purposes.
- **Tax Authorities**: Use the system to audit and validate electronic documents for regulatory adherence.

## Domain Rules & Invariants

- **Validation Constraints**: All NFSe documents must comply with the standard XML schema as dictated by SEFAZ and Abrasf.
- **Compliance Requirements**: Certificates must be validated and renewed regularly to ensure uninterrupted service.
- **Localization Nuances**: Municipalities may have distinct rules, impacting how NFSe is processed and reported.

## Related Resources

- [Project Overview](./project-overview.md)

This glossary serves as a foundational document for understanding and navigating the complex interactions within the project.
