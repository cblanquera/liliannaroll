//to run this on testnet:
// $ npx hardhat run scripts/deploy.js

const hardhat = require('hardhat')

async function main() {
  await hre.run('compile')
  const NFT = await hardhat.ethers.getContractFactory('LiliannaRoll')
  const nft = await NFT.deploy('https://ipfs.io/ipfs/bafkreidibhx22pgsfbimywastzvbxyqjpbh6rnivvkoionrq3k6mermslm')
  await nft.deployed()
  console.log('NFT contract deployed to (update .env):', nft.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
