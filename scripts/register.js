//to run this on testnet:
// $ npx hardhat run scripts/register.js

const hardhat = require('hardhat')
const tokens = require('../data/tokens.json')

async function main() {
  const network = hardhat.config.networks[hardhat.config.defaultNetwork]
  const provider = new hardhat.ethers.providers.JsonRpcProvider(network.url)

  const NFT = await hardhat.ethers.getContractFactory('LiliannaRoll')
  const nft = await NFT.attach(network.contracts[0])

  let id = 0
  for (const name in tokens) {
    if (id < 9) {
      ++id
      continue
    }
    const gasPrice = (await provider.getGasPrice()).mul(5).toString(); //wei
    const GgasPrice = Math.ceil(parseInt(gasPrice) / 1000000000)
    const gasLimit = Math.floor(GgasPrice * 21000)

    const size = tokens[name].limit
    const offer = tokens[name].price ? ethers.utils.parseEther(tokens[name].price): 0
    const uri = tokens[name]['base-token-uri'] || tokens[name]['fixed-token-uri'] || ''
    const fixedURI = typeof tokens[name]['fixed-token-uri'] === 'string'

    console.log(
      'adding collection',
      ++id, 
      size, 
      offer,
      uri,
      fixedURI,
    )
    
    await nft.makeCollection(
      id, 
      size, 
      offer,
      uri,
      fixedURI,
      { gasPrice, gasLimit }
    )
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
