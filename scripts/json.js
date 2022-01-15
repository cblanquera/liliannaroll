//to run this on testnet:
// $ node scripts/json.js

const fs = require('fs')
const path = require('path')
const tokens = require('../data/tokens.json')

async function main() {
  for (const name in tokens) {
    for (let index = 0; index < tokens[name].limit; index++) {
      const file = path.resolve(__dirname, '../data', name, 'json', `${index}.json`)
      const json = Object.assign({}, tokens[name].metadata)
      json.name = json.name.replace('{ID}', index + 1)
      json.image = json.image.replace('{ID}', index + 1)
      json.description = json.description.replace('{ID}', index + 1)
      json.external_url = json.external_url.replace('{ID}', index + 1)
      json.animation_url = json.animation_url.replace('{ID}', index + 1)
      fs.writeFileSync(file, JSON.stringify(json, null, 2))
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
