# Development Workflow

The development workflow for this repository is designed to ensure smooth collaboration, maintain high code quality, and facilitate continuous integration and deployment. This document outlines the key practices that team members should follow in their day-to-day engineering activities.

## Branching & Releases

Our project follows a **Git Flow** branching model with the following key elements:

- **Main Branch**: The `main` branch contains production-ready code.
- **Develop Branch**: The `develop` branch is used for integrating features that are ready for release.
- **Feature Branches**: Created from `develop` and named as `feature/{feature-name}`, these branches host in-progress work.
- **Release Branches**: These are created when we prepare a new release, named as `release/{version}`.
- **Hotfix Branches**: Created from `main` for quick production fixes, named as `hotfix/{issue-name}`.

**Release Cadence & Tagging Conventions**:
- Releases are tagged with version numbers following semantic versioning, e.g., `v1.0.0`.

## Local Development

To set up your local development environment, follow these steps:

- Install project dependencies:
  ```bash
  npm install
  ```
- Run the project locally:
  ```bash
  npm run dev
  ```
- Build the project for distribution:
  ```bash
  npm run build
  ```

## Code Review Expectations

Code reviews are an essential part of our quality control process. Developers are expected to:

- Follow the [AGENTS.md](./AGENTS.md) guide for collaboration.
- Ensure the code adheres to our style guide and passes all tests.
- Address review comments promptly and seek approval from at least two peers before merging.

## Onboarding Tasks

New team members can start with the following onboarding tasks to familiarize themselves with the codebase:

- Review the [first issues](./first-issues) section to find beginner-friendly tasks.
- Access internal runbooks and dashboards for detailed process descriptions and metrics tracking.

## Related Resources

For further details, please refer to the following documents:

- [Testing Strategy](./testing-strategy.md)
- [Tooling](./tooling.md)
