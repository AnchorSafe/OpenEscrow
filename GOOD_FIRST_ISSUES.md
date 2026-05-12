# Good First Issues

New to OpenEscrow? These are well-scoped, self-contained tasks ideal for first-time contributors.

---

## Frontend

### 1. Add copy-to-clipboard for Stellar addresses
**Difficulty:** Easy  
**Skills:** React, TypeScript  
In `EscrowCard` and `EscrowDetailPage`, clicking a truncated address should copy the full address to clipboard and show a brief "Copied!" tooltip.

### 2. Add loading skeleton for dashboard cards
**Difficulty:** Easy  
**Skills:** React, Tailwind  
Replace the `<Spinner />` on the dashboard with skeleton placeholder cards that match the `EscrowCard` layout.

### 3. Add a "No deadline" label when deadline is 0
**Difficulty:** Easy  
**Skills:** React, TypeScript  
In `MilestoneList`, when `m.deadline === 0`, show "No deadline" instead of nothing.

### 4. Add currency amount input in XLM/USDC (not stroops)
**Difficulty:** Medium  
**Skills:** React, TypeScript  
In `CreateEscrowForm`, let users enter amounts in XLM/USDC and convert to stroops internally. Show the stroop equivalent below the input.

### 5. Add escrow status filter tabs on dashboard
**Difficulty:** Medium  
**Skills:** React, TypeScript  
Add tabs (All / Active / Disputed / Completed) above the escrow grid to filter by status client-side.

---

## Backend

### 6. Add pagination to `GET /api/escrows`
**Difficulty:** Easy  
**Skills:** Node.js, TypeScript, SQL  
Add `limit` and `offset` query params to the list endpoint. Default: `limit=20, offset=0`.

### 7. Add `GET /api/escrows/:id/timeline`
**Difficulty:** Medium  
**Skills:** Node.js, TypeScript  
Return a chronological list of events for an escrow (created, funded, milestone submitted, etc.) derived from the `tx_hashes` array and status history.

### 8. Add input sanitisation for milestone titles
**Difficulty:** Easy  
**Skills:** Node.js, Zod  
Strip HTML tags and control characters from milestone `title` fields in the Zod schema.

---

## Smart Contract

### 9. Add `get_milestone(index)` view function
**Difficulty:** Easy  
**Skills:** Rust, Soroban  
Add a read-only function that returns a single `Milestone` by index, to avoid fetching the full escrow state for milestone-only queries.

### 10. Emit contract events for each state transition
**Difficulty:** Medium  
**Skills:** Rust, Soroban  
Use `env.events().publish()` to emit structured events on `fund`, `approve_milestone`, `raise_dispute`, and `resolve_dispute`. This enables off-chain indexers to track state without polling.

---

## Documentation

### 11. Add architecture diagram to docs/
**Difficulty:** Easy  
**Skills:** Markdown, diagrams  
Create `docs/architecture.md` with a detailed sequence diagram of the full escrow lifecycle using Mermaid syntax.

### 12. Write a "Deploy to testnet" tutorial
**Difficulty:** Easy  
**Skills:** Markdown, Stellar CLI  
Write `docs/deploy-testnet.md` with step-by-step instructions for deploying the contract and running the app against Stellar testnet.

---

## How to Claim an Issue

1. Comment on the GitHub issue: "I'd like to work on this"
2. Fork the repo and create a branch: `git checkout -b fix/issue-number-description`
3. Submit a PR referencing the issue: `Closes #N`

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.
