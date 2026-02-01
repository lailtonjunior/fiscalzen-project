# Tooling & Productivity Guide

This guide provides an overview of the scripts, automation, and editor settings that keep contributors efficient when working on the FiscalZen project.

## Required Tooling

- **Node.js & NPM**
  - **Installation:** Download and install from the [official website](https://nodejs.org/).
  - **Version:** Ensure you're using the LTS version for stability.
  - **Purpose:** Builds and runs JavaScript/TypeScript applications, manages packages.
  
- **Docker**
  - **Installation:** Follow instructions for your OS on the [Docker website](https://www.docker.com/).
  - **Version:** Latest stable release.
  - **Purpose:** Containerizes applications for development and production, ensuring consistency across environments.

- **Git**
  - **Installation:** Install from [Git's official website](https://git-scm.com/).
  - **Version:** 2.0 or newer.
  - **Purpose:** Version control and collaboration.

- **Visual Studio Code**
  - **Installation:** Available on the [VS Code website](https://code.visualstudio.com/).
  - **Version:** Latest stable release.
  - **Purpose:** Source code editor with support for extensions and integrations.

## Recommended Automation

- **Pre-Commit Hooks**
  - Utilize pre-commit hooks to automate code checks before each commit. This ensures code quality and consistency.

- **Linting and Formatting**
  - **ESLint & Prettier** are set up to maintain code style and quality.
  - Use `npm run lint` and `npm run format` commands during development.

- **Code Generators & Scaffolding**
  - Generators help quickly set up components or modules, reducing repetitive tasks.
  - Consider using tools like Yeoman or custom scripts included in the repo.

- **Watch Modes**
  - Use development scripts with watch capabilities to automatically rebuild or reload code during active development. Example: `npm run dev`.

## IDE / Editor Setup

- **ESLint**
  - Keep consistent coding styles and reduce bugs by setting up the ESLint extension in VS Code.

- **Prettier**
  - Ensure automatic formatting of your code using the Prettier extension.

- **Docker Extension**
  - Manage Docker containers and images directly from your editor.

- **GitLint**
  - Automated checking of commit messages to conform to standards.

## Productivity Tips

- **Terminal Aliases**
  - Set up custom terminal aliases for frequent git commands or scripts to save time.
  
- **Container Workflows**
  - Leverage Docker Compose for orchestrating multiple service containers when working on full-stack features.

- **Local Emulators**
  - Use local development databases or emulators for services to replicate production environments during testing.

- **Link to Resources**
  - Consider sharing scripts or dotfiles that optimize your workflow across the team.

## Related Resources

- [Development Workflow Guide](./development-workflow.md)

For detailed workflow processes and additional resources, refer to the [development-workflow.md](./development-workflow.md). This guide offers deeper insights into the development practices and principles to follow within the project.
