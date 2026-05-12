# Contributing to OpenEscrow

Thank you for your interest in contributing. OpenEscrow is open-source infrastructure — every contribution matters.

## Ways to Contribute

- Fix bugs or open issues
- Add features from the [roadmap](./ROADMAP.md)
- Improve documentation
- Write tests
- Review pull requests
- Report security issues

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<you>/openescrow.git`
3. Install dependencies: `npm install`
4. Copy env: `cp backend/.env.example backend/.env`
5. Create a branch: `git checkout -b feat/your-feature`

## Development Workflow

```bash
# Run everything
npm run dev

# Run contract tests
npm run contracts:test

# Run backend tests
npm test --workspace=backend

# Lint frontend
npm run lint --workspace=frontend
```

## Code Style

- TypeScript strict mode — no `any`
- Rust: `cargo fmt` and `cargo clippy` before committing
- Commit messages: `type(scope): description` (e.g. `fix(contract): prevent double-release`)

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include tests for new behaviour
- Update documentation if the API or contract interface changes
- Reference the issue your PR closes: `Closes #123`

## Reporting Security Issues

Do **not** open a public issue for security vulnerabilities. Email `security@openescrow.dev` with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond within 48 hours.

## Code of Conduct

Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
