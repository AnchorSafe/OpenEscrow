#!/usr/bin/env node
/**
 * deploy-contracts.js
 *
 * Builds and deploys the OpenEscrow Soroban contract to Stellar testnet or mainnet.
 *
 * Usage:
 *   node scripts/deploy-contracts.js [--network testnet|mainnet]
 *
 * Requires:
 *   - stellar-cli installed (cargo install stellar-cli)
 *   - PLATFORM_SECRET_KEY in backend/.env
 */

const { execSync } = require('child_process')
const { existsSync, readFileSync, writeFileSync } = require('fs')
const path = require('path')

const network = process.argv.includes('--network')
  ? process.argv[process.argv.indexOf('--network') + 1]
  : 'testnet'

if (!['testnet', 'mainnet'].includes(network)) {
  console.error('Invalid network. Use --network testnet or --network mainnet')
  process.exit(1)
}

const WASM_PATH = path.join(
  __dirname,
  '../contracts/target/wasm32-unknown-unknown/release/openescrow_contract.wasm'
)
const ENV_PATH = path.join(__dirname, '../backend/.env')

// Load secret key from .env
function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error('backend/.env not found. Copy backend/.env.example and fill in values.')
    process.exit(1)
  }
  const lines = readFileSync(ENV_PATH, 'utf8').split('\n')
  const env = {}
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) env[key.trim()] = rest.join('=').trim()
  }
  return env
}

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`)
  return execSync(cmd, { stdio: 'inherit', ...opts })
}

function runCapture(cmd) {
  console.log(`\n$ ${cmd}`)
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n🚀 OpenEscrow Contract Deployment`)
console.log(`   Network: ${network}`)

// 1. Build
console.log('\n📦 Building contract...')
run('cargo build --target wasm32-unknown-unknown --release', {
  cwd: path.join(__dirname, '../contracts'),
})

if (!existsSync(WASM_PATH)) {
  console.error('WASM build artifact not found at:', WASM_PATH)
  process.exit(1)
}
console.log('✅ Contract built:', WASM_PATH)

// 2. Deploy
const env = loadEnv()
const secretKey = env['PLATFORM_SECRET_KEY']
if (!secretKey) {
  console.error('PLATFORM_SECRET_KEY not set in backend/.env')
  process.exit(1)
}

console.log('\n🔗 Deploying to', network, '...')
const contractId = runCapture(
  `stellar contract deploy \
    --wasm ${WASM_PATH} \
    --source ${secretKey} \
    --network ${network}`
)

console.log('\n✅ Contract deployed!')
console.log('   Contract ID:', contractId)

// 3. Update .env
const envContent = readFileSync(ENV_PATH, 'utf8')
const updated = envContent.replace(
  /^ESCROW_CONTRACT_ID=.*/m,
  `ESCROW_CONTRACT_ID=${contractId}`
)
writeFileSync(ENV_PATH, updated)
console.log('\n✅ ESCROW_CONTRACT_ID written to backend/.env')

console.log('\n🎉 Done! Next steps:')
console.log('   1. npm run dev')
console.log(`   2. View on explorer: https://stellar.expert/explorer/${network}/contract/${contractId}`)
