#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String, Vec,
};

fn setup() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mediator = Address::generate(&env);

    // Deploy a test token (SAC-compatible)
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_id.address();

    // Mint tokens to payer
    let sac = StellarAssetClient::new(&env, &token_address);
    sac.mint(&payer, &10_000_0000000_i128); // 10,000 units

    (env, payer, recipient, mediator, token_address)
}

fn make_milestones(env: &Env) -> Vec<Milestone> {
    let mut ms = Vec::new(env);
    ms.push_back(Milestone {
        title: String::from_str(env, "Design"),
        amount: 300_0000000,
        deadline: 0,
        status: MilestoneStatus::Pending,
    });
    ms.push_back(Milestone {
        title: String::from_str(env, "Development"),
        amount: 400_0000000,
        deadline: 0,
        status: MilestoneStatus::Pending,
    });
    ms.push_back(Milestone {
        title: String::from_str(env, "Delivery"),
        amount: 300_0000000,
        deadline: 0,
        status: MilestoneStatus::Pending,
    });
    ms
}

#[test]
fn test_full_happy_path() {
    let (env, payer, recipient, mediator, token) = setup();
    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let milestones = make_milestones(&env);

    // Create
    let escrow = client.create(&payer, &recipient, &mediator, &token, &milestones);
    assert_eq!(escrow.status, EscrowStatus::Created);
    assert_eq!(escrow.total_amount, 1000_0000000);

    // Fund
    let escrow = client.fund();
    assert_eq!(escrow.status, EscrowStatus::Active);

    // Verify contract holds the funds
    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&contract_id), 1000_0000000);

    // Milestone 0: submit → approve
    client.submit_milestone(&0);
    let escrow = client.approve_milestone(&0);
    assert_eq!(escrow.released_amount, 300_0000000);
    assert_eq!(token_client.balance(&recipient), 300_0000000);

    // Milestone 1: submit → approve
    client.submit_milestone(&1);
    client.approve_milestone(&1);

    // Milestone 2: submit → approve → auto-complete
    client.submit_milestone(&2);
    let escrow = client.approve_milestone(&2);
    assert_eq!(escrow.status, EscrowStatus::Completed);
    assert_eq!(escrow.released_amount, 1000_0000000);
    assert_eq!(token_client.balance(&recipient), 1000_0000000);
    assert_eq!(token_client.balance(&contract_id), 0);
}

#[test]
fn test_dispute_and_resolve_for_recipient() {
    let (env, payer, recipient, mediator, token) = setup();
    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    client.create(&payer, &recipient, &mediator, &token, &make_milestones(&env));
    client.fund();
    client.submit_milestone(&0);

    // Payer disputes milestone 0
    let escrow = client.raise_dispute(&0, &String::from_str(&env, "Work not satisfactory"));
    assert_eq!(escrow.status, EscrowStatus::Disputed);

    // Mediator resolves in favour of recipient
    let escrow = client.resolve_dispute(&0, &true);
    assert_eq!(escrow.status, EscrowStatus::Active);

    let token_client = TokenClient::new(&env, &token);
    assert_eq!(token_client.balance(&recipient), 300_0000000);
}

#[test]
fn test_dispute_and_refund_to_payer() {
    let (env, payer, recipient, mediator, token) = setup();
    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    client.create(&payer, &recipient, &mediator, &token, &make_milestones(&env));
    client.fund();
    client.submit_milestone(&0);
    client.raise_dispute(&0, &String::from_str(&env, "Fraud"));

    // Mediator sides with payer
    client.resolve_dispute(&0, &false);

    let token_client = TokenClient::new(&env, &token);
    // Payer started with 10000, deposited 1000, got 300 back → 9300
    assert_eq!(token_client.balance(&payer), 9300_0000000);
}

#[test]
fn test_refund_before_fund() {
    let (env, payer, recipient, mediator, token) = setup();
    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    client.create(&payer, &recipient, &mediator, &token, &make_milestones(&env));
    let escrow = client.refund();
    assert_eq!(escrow.status, EscrowStatus::Refunded);
}

#[test]
fn test_partial_refund_after_release() {
    let (env, payer, recipient, mediator, token) = setup();
    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    client.create(&payer, &recipient, &mediator, &token, &make_milestones(&env));
    client.fund();
    client.submit_milestone(&0);
    client.approve_milestone(&0); // 300 released

    // Payer cancels; remaining 700 refunded
    let escrow = client.refund();
    assert_eq!(escrow.status, EscrowStatus::Refunded);

    let token_client = TokenClient::new(&env, &token);
    // payer: 10000 - 1000 deposited + 700 refunded = 9700
    assert_eq!(token_client.balance(&payer), 9700_0000000);
}
