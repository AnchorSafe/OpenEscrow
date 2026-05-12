import {
  Horizon,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  nativeToScVal,
  Address,
  Contract,
  scValToNative,
} from '@stellar/stellar-sdk'

const NETWORK = process.env.STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org'
const RPC_URL = process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET

// USDC issuer on testnet (Circle)
export const USDC_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
export const USDC_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'

export const horizon = new Horizon.Server(HORIZON_URL)
export const rpc = new SorobanRpc.Server(RPC_URL)

export function usdcAddress(): string {
  return NETWORK === 'mainnet' ? USDC_MAINNET : USDC_TESTNET
}

export function xlmAddress(): string {
  // XLM native SAC address differs per network; use the well-known testnet address
  return NETWORK === 'mainnet'
    ? 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA'
    : 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
}

export function tokenAddress(currency: 'XLM' | 'USDC'): string {
  return currency === 'USDC' ? usdcAddress() : xlmAddress()
}

// ── Transaction helpers ───────────────────────────────────────────────────────

export async function buildAndSubmit(
  sourceKeypair: Keypair,
  operations: xdr.Operation[]
): Promise<string> {
  const account = await rpc.getAccount(sourceKeypair.publicKey())
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })

  for (const op of operations) {
    tx.addOperation(op)
  }

  const built = tx.setTimeout(30).build()
  const prepared = await rpc.prepareTransaction(built)
  prepared.sign(sourceKeypair)

  const result = await rpc.sendTransaction(prepared)
  if (result.status === 'ERROR') {
    throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`)
  }

  // Poll for confirmation
  const hash = result.hash
  let attempts = 0
  while (attempts < 20) {
    await sleep(1500)
    const status = await rpc.getTransaction(hash)
    if (status.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) return hash
    if (status.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction ${hash} failed on-chain`)
    }
    attempts++
  }
  throw new Error(`Transaction ${hash} timed out`)
}

// ── Contract invocation helpers ───────────────────────────────────────────────

export async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signerKeypair: Keypair
): Promise<{ txHash: string; result: unknown }> {
  const contract = new Contract(contractId)
  const op = contract.call(method, ...args)
  const txHash = await buildAndSubmit(signerKeypair, [op])

  // Fetch result from ledger
  const txResult = await rpc.getTransaction(txHash)
  const result =
    txResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS
      ? scValToNative(txResult.returnValue!)
      : null

  return { txHash, result }
}

// ── Stellar account helpers ───────────────────────────────────────────────────

export async function getAccountBalances(publicKey: string) {
  const account = await horizon.loadAccount(publicKey)
  return account.balances
}

export async function getTransactionDetails(txHash: string) {
  return horizon.transactions().transaction(txHash).call()
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function toScAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal()
}

export function toScString(env: unknown, s: string): xdr.ScVal {
  return xdr.ScVal.scvString(Buffer.from(s))
}

export function toScI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: 'i128' })
}

export function toScU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: 'u32' })
}

export function toScBool(value: boolean): xdr.ScVal {
  return xdr.ScVal.scvBool(value)
}
