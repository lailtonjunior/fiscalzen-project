# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **PostgreSQL port standardized to 5432** - Docker now maps `5432:5432` instead of `5433:5432`
- **Updated drizzle-kit commands** - Removed deprecated `:pg` suffix from `generate` and `push` commands
- **Upgraded drizzle-orm** from 0.29.3 to 0.35.0
- **Upgraded drizzle-kit** from 0.20.18 to 0.24.0
- **Upgraded bullmq** from 5.1.0 to 5.40.0

### Added
- `scripts/verify-config.mjs` - Configuration verification script
- `pnpm verify-config` command for checking configuration consistency
- `.context/docs/runbooks/CONFIG_FIX.md` - Runbook for configuration changes

### Fixed
- Port inconsistency between docker-compose.yml and .env.example files
- Deprecated drizzle-kit syntax that would fail on newer versions
- CLI tests failing due to missing `--passWithNoTests` flag
