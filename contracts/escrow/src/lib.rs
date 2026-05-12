//! OpenEscrow — Soroban smart contract
//!
//! Lifecycle:
//!   Created → Funded → Active → (Disputed?) → Completed | Refunded
//!
//! Key invariants:
//!   - Only the payer can fund and raise disputes.
//!   - Only the recipient can mark milestones complete.
//!   - Funds are released per-milestone; total released never exceeds deposited amount.
//!   - A mediator (set at creation) can resolve disputes.
//!   - No admin back-door: the contract holds funds trustlessly.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Vec,
};

// ─── Storage keys ────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Escrow,
}

// ─── Domain types ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum EscrowStatus {
    Created,
    Funded,
    Active,
    Disputed,
    Completed,
    Refunded,
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,   // recipient signals work is done
    Approved,    // payer approves → triggers release
    Released,    // funds transferred
    Disputed,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub title: String,
    pub amount: i128,          // in stroops (XLM) or token base units
    pub deadline: u64,         // Unix timestamp; 0 = no deadline
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct EscrowAgreement {
    pub payer: Address,
    pub recipient: Address,
    pub mediator: Address,     // dispute resolver; can be same as payer for trustless
    pub token: Address,        // XLM native or USDC contract address
    pub total_amount: i128,
    pub released_amount: i128,
    pub milestones: Vec<Milestone>,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub dispute_reason: String,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Create a new escrow agreement. Funds are NOT transferred yet.
    ///
    /// # Arguments
    /// * `payer`        – account funding the escrow
    /// * `recipient`    – account receiving milestone payments
    /// * `mediator`     – account that can resolve disputes (use payer for self-mediation)
    /// * `token`        – SAC address for XLM or USDC
    /// * `milestones`   – ordered list of milestones; amounts must sum to total_amount
    pub fn create(
        env: Env,
        payer: Address,
        recipient: Address,
        mediator: Address,
        token: Address,
        milestones: Vec<Milestone>,
    ) -> EscrowAgreement {
        payer.require_auth();

        let total_amount: i128 = milestones.iter().map(|m| m.amount).sum();
        assert!(total_amount > 0, "total amount must be positive");
        assert!(!milestones.is_empty(), "at least one milestone required");
        assert!(milestones.len() <= 20, "max 20 milestones");

        let escrow = EscrowAgreement {
            payer,
            recipient,
            mediator,
            token,
            total_amount,
            released_amount: 0,
            milestones,
            status: EscrowStatus::Created,
            created_at: env.ledger().timestamp(),
            dispute_reason: String::from_str(&env, ""),
        };

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        escrow
    }

    /// Payer deposits the full escrow amount into the contract.
    /// Must be called after `create`.
    pub fn fund(env: Env) -> EscrowAgreement {
        let mut escrow: EscrowAgreement = Self::load(&env);
        escrow.payer.require_auth();

        assert!(
            escrow.status == EscrowStatus::Created,
            "escrow already funded or closed"
        );

        let client = token::Client::new(&env, &escrow.token);
        client.transfer(
            &escrow.payer,
            &env.current_contract_address(),
            &escrow.total_amount,
        );

        escrow.status = EscrowStatus::Active;
        env.storage().instance().set(&DataKey::Escrow, &escrow);
        escrow
    }

    /// Recipient signals that milestone `index` work is complete.
    pub fn submit_milestone(env: Env, index: u32) -> EscrowAgreement {
        let mut escrow: EscrowAgreement = Self::load(&env);
        escrow.recipient.require_auth();

        assert!(escrow.status == EscrowStatus::Active, "escrow not active");

        let mut milestones = escrow.milestones.clone();
        let mut m = milestones.get(index).expect("invalid milestone index");
        assert!(m.status == MilestoneStatus::Pending, "milestone not pending");

        m.status = MilestoneStatus::Submitted;
        milestones.set(index, m);
        escrow.milestones = milestones;

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        escrow
    }

    /// Payer approves milestone `index`, releasing its funds to the recipient.
    pub fn approve_milestone(env: Env, index: u32) -> EscrowAgreement {
        let mut escrow: EscrowAgreement = Self::load(&env);
        escrow.payer.require_auth();

        assert!(escrow.status == EscrowStatus::Active, "escrow not active");

        let mut milestones = escrow.milestones.clone();
        let mut m = milestones.get(index).expect("invalid milestone index");
        assert!(
            m.status == MilestoneStatus::Submitted,
            "milestone not submitted"
        );

        // Transfer milestone amount to recipient
        let client = token::Client::new(&env, &escrow.token);
        client.transfer(
            &env.current_contract_address(),
            &escrow.recipient,
            &m.amount,
        );

        m.status = MilestoneStatus::Released;
        milestones.set(index, m.clone());
        escrow.milestones = milestones;
        escrow.released_amount += m.amount;

        // Auto-complete when all milestones released
        let all_released = escrow
            .milestones
            .iter()
            .all(|ms| ms.status == MilestoneStatus::Released);
        if all_released {
            escrow.status = EscrowStatus::Completed;
        }

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        escrow
    }

    /// Payer raises a dispute on milestone `index`.
    pub fn raise_dispute(env: Env, index: u32, reason: String) -> EscrowAgreement {
        let mut escrow: EscrowAgreement = Self::load(&env);
        escrow.payer.require_auth();

        assert!(escrow.status == EscrowStatus::Active, "escrow not active");

        let mut milestones = escrow.milestones.clone();
        let mut m = milestones.get(index).expect("invalid milestone index");
        assert!(
            m.status == MilestoneStatus::Submitted || m.status == MilestoneStatus::Pending,
            "cannot dispute this milestone state"
        );

        m.status = MilestoneStatus::Disputed;
        milestones.set(index, m);
        escrow.milestones = milestones;
        escrow.status = EscrowStatus::Disputed;
        escrow.dispute_reason = reason;

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        escrow
    }

    /// Mediator resolves a dispute.
    ///
    /// * `release_to_recipient` – if true, releases the disputed milestone to recipient;
    ///                            if false, refunds that milestone amount to payer.
    pub fn resolve_dispute(
        env: Env,
        index: u32,
        release_to_recipient: bool,
    ) -> EscrowAgreement {
        let mut escrow: EscrowAgreement = Self::load(&env);
        escrow.mediator.require_auth();

        assert!(
            escrow.status == EscrowStatus::Disputed,
            "escrow not in disputed state"
        );

        let mut milestones = escrow.milestones.clone();
        let mut m = milestones.get(index).expect("invalid milestone index");
        assert!(m.status == MilestoneStatus::Disputed, "milestone not disputed");

        let client = token::Client::new(&env, &escrow.token);

        if release_to_recipient {
            client.transfer(
                &env.current_contract_address(),
                &escrow.recipient,
                &m.amount,
            );
            escrow.released_amount += m.amount;
            m.status = MilestoneStatus::Released;
        } else {
            client.transfer(
                &env.current_contract_address(),
                &escrow.payer,
                &m.amount,
            );
            m.status = MilestoneStatus::Pending; // reset for potential re-work
        }

        milestones.set(index, m);
        escrow.milestones = milestones;

        // Resume active state; mediator may need to resolve multiple milestones
        let still_disputed = escrow
            .milestones
            .iter()
            .any(|ms| ms.status == MilestoneStatus::Disputed);
        if !still_disputed {
            let all_done = escrow
                .milestones
                .iter()
                .all(|ms| ms.status == MilestoneStatus::Released);
            escrow.status = if all_done {
                EscrowStatus::Completed
            } else {
                EscrowStatus::Active
            };
        }

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        escrow
    }

    /// Payer cancels the escrow before it is funded, or after all parties agree.
    /// Refunds any unreleased balance to payer.
    pub fn refund(env: Env) -> EscrowAgreement {
        let mut escrow: EscrowAgreement = Self::load(&env);
        escrow.payer.require_auth();

        assert!(
            escrow.status == EscrowStatus::Created
                || escrow.status == EscrowStatus::Active,
            "cannot refund in current state"
        );

        let unreleased = escrow.total_amount - escrow.released_amount;
        if unreleased > 0 && escrow.status == EscrowStatus::Active {
            let client = token::Client::new(&env, &escrow.token);
            client.transfer(
                &env.current_contract_address(),
                &escrow.payer,
                &unreleased,
            );
        }

        escrow.status = EscrowStatus::Refunded;
        env.storage().instance().set(&DataKey::Escrow, &escrow);
        escrow
    }

    /// Read-only view of the escrow state.
    pub fn get(env: Env) -> EscrowAgreement {
        Self::load(&env)
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    fn load(env: &Env) -> EscrowAgreement {
        env.storage()
            .instance()
            .get(&DataKey::Escrow)
            .expect("escrow not initialized")
    }
}

mod test;
