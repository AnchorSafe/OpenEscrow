#!/usr/bin/env node
/**
 * setup-testnet.js
 *
 * Generates test keypairs and funds them via Friendbot for local development.
 *
 * Usage:
 *   node scripts/setup-testnet.js
 */

const https = require('https')

function friendbot(publicKey) {
  return new Promise((resolve, reject) => {
    const url = `https://friendbot.stellar.org?addr=${publicKey}`
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data))
        else reject(new Error(`Friendbot failed: ${data}`))
      })
    }).on('error', reject)
  })
}

async function main() {
  // Dynamically import stellar-sdk (ESM)
  const { Keypair } = await import('@stellar/stellar-sdk')

  const roles = ['payer', 'recipient', 'mediator', 'platform']
  const keypairs = {}

  console.log('\n🔑 Generating test keypairs...\n')
  for (const role of roles) {
    const kp = Keypair.random()
    keypairs[role] = { publicKey: kp.publicKey(), secretKey: kp.secret() }
    console.log(`${role.padEnd(12)} public:  ${kp.publicKey()}`)
    console.log(`${role.padEnd(12)} secret:  ${kp.secret()}\n`)
  }

  console.log('💧 Funding accounts via Friendbot...')
  for (const [role, kp] of Object.entries(keypairs)) {
    try {
      await friendbot(kp.publicKey)
      console.log(`✅ Funded ${role}: ${kp.publicKey}`)
    } catch (err) {
      console.error(`❌ Failed to fund ${role}:`, err.message)
    }
  }

  console.log('\n📋 Add to backend/.env:')
  console.log(`PLATFORM_SECRET_KEY=${keypairs.platform.secretKey}`)
  console.log('\n📋 Use for testing:')
  console.log(`Payer secret:     ${keypairs.payer.secretKey}`)
  console.log(`Recipient secret: ${keypairs.recipient.secretKey}`)
  console.log(`Mediator secret:  ${keypairs.mediator.secretKey}`)
}

main().catch(console.error)
