# FiscalZen Project Documentation

Welcome to the FiscalZen project documentation. This guide provides an overview of the project structure, architecture, and core functionalities to help developers navigate and contribute effectively.

## Overview

The FiscalZen project is a comprehensive software system aimed at managing and processing electronic fiscal documents, primarily focused on the Brazilian NF-e (Nota Fiscal Eletrônica) ecosystem. It includes tools for document parsing, validation, storage, and integration with governmental systems.

## Project Structure

### Core Components

- **Config**: Configuration files and settings across various packages and applications.
- **Generators**: Responsible for generating PDF documents like DANFE and DACTE.
- **Repositories**: Database interactions and schema management.
- **Controllers**: API and application logic handling.
- **Utils**: Shared utility functions and constants.
- **Services**: Business logic and integrations with external systems.
- **Models**: Data schema definitions.
- **Components**: Frontend user interface components.

### Public API

The project exposes a variety of public classes, functions, and types, including:

- `AbrasfClient`
- `SefazClient`
- `DanfeGenerator`
- Various service functions like `addCertificateCheckerJob`

For a complete list of exported symbols, refer to the source code files within their respective directories.

## Architecture

### Key Areas

- **Config**: Centralized configuration management for seamless integration among different modules.
- **Generators**: Handles the creation of PDF documents required for official documentation.
- **Repositories**: Manages data persistence and retrieval with a focus on scalability and performance.

### Major Dependencies

- `apps\api\src\app.ts`: The main API application setup, importing multiple configurations and routes.
- `packages\xml-parser\src\parsers\auto.ts`: Automatically detects and parses XML document types.
- `packages\nfse-client\src\factory.ts`: Provides a factory for creating client instances to interact with NFSe services.

## Development Workflow

Developers are encouraged to follow a consistent workflow involving branching strategies, pull requests, and continuous integration (CI) processes. Key documents related to workflow include:

- `development-workflow.md`: Detailed information on branching, contribution guidelines, and CI/CD practices.
- `testing-strategy.md`: Describes testing configurations and gates for quality assurance.

## Security and Compliance

Security is a high priority, especially given the sensitive nature of fiscal document processing. Key areas include:

- **Authentication model**: Ensuring secure access to different parts of the system.
- **Data compliance**: Aligning with data protection regulations and governmental requirements.

## Contributing

Contributors are encouraged to familiarize themselves with the project by reviewing:

- Architecture Notes
- Glossary & Domain Concepts
- Tooling & Productivity Guide

These documents provide insights into the project's domain, tools, and development priorities.

## Additional Resources

- **Glossary**: A comprehensive list of domain-specific terms and concepts.
- **Data Flow & Integrations**: Details on system architecture and integrations with external services.
- **Tooling Guide**: Recommendations and configurations for development tools and environments.

For additional guidance or to report any issues, please refer to the project's CONTRIBUTING.md file or contact the repository maintainers.

---

This documentation is a living document and will be updated regularly to reflect changes in the codebase and best practices. Thank you for contributing to the FiscalZen project.
