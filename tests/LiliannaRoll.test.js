const { expect } = require('chai');
require('dotenv').config()

if (process.env.BLOCKCHAIN_NETWORK != 'hardhat') {
  console.error('Exited testing with network:', process.env.BLOCKCHAIN_NETWORK)
  process.exit(1);
}

async function getSigners(name, ...params) {
  //deploy the contract
  const ContractFactory = await ethers.getContractFactory(name)
  const contract = await ContractFactory.deploy(...params)
  await contract.deployed()
  //get the signers
  const signers = await ethers.getSigners()
  //attach contracts
  for (let i = 0; i < signers.length; i++) {
    const Contract = await ethers.getContractFactory(name, signers[i])
    signers[i].withContract = await Contract.attach(contract.address)
  }

  return signers
}

function hashToken(collectionId, recipient) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['uint256', 'address'],
      [collectionId, recipient]
    ).slice(2),
    'hex'
  )
}

describe('LiliannaRoll Tests', function () {
  before(async function() {
    const [
      contractOwner, 
      tokenOwner1, 
      tokenOwner2, 
      tokenOwner3, 
      tokenOwner4 
    ] = await getSigners('LiliannaRoll', 'http://example.com/contract.json')
    
    this.signers = { 
      contractOwner, 
      tokenOwner1, 
      tokenOwner2, 
      tokenOwner3, 
      tokenOwner4 
    }
  })
  
  it('Should register collections', async function () {
    const { contractOwner } = this.signers
    await contractOwner.withContract.fixCollectionSize(1, 4)
    await contractOwner.withContract.makeCollectionOffer(1, ethers.utils.parseEther('0.05'))
    await contractOwner.withContract.setCollectionBaseURI(1, 'https://ipfs.io/ipfs/Qm123abc/')

    expect(await contractOwner.withContract.collectionSize(1)).to.equal(4)
    expect(await contractOwner.withContract.collectionOffer(1)).to.equal(ethers.utils.parseEther('0.05'))
    expect(await contractOwner.withContract.collectionBaseURI(1)).to.equal('https://ipfs.io/ipfs/Qm123abc/')

    await contractOwner.withContract.fixCollectionSize(2, 2)
    await contractOwner.withContract.makeCollectionOffer(2, ethers.utils.parseEther('0.10'))
    await contractOwner.withContract.setCollectionFixedURI(2, 'https://ipfs.io/ipfs/Qm123abc')

    expect(await contractOwner.withContract.collectionSize(2)).to.equal(2)
    expect(await contractOwner.withContract.collectionOffer(2)).to.equal(ethers.utils.parseEther('0.10'))
    expect(await contractOwner.withContract.collectionFixedURI(2)).to.equal('https://ipfs.io/ipfs/Qm123abc')

    expect(await contractOwner.withContract.collectionSize(3)).to.equal(0)
    expect(await contractOwner.withContract.collectionOffer(3)).to.equal(0)
    expect(await contractOwner.withContract.collectionFixedURI(3)).to.equal('')
  })

  it('Should mint collections', async function () {
    const { contractOwner, tokenOwner1, tokenOwner2, tokenOwner3, tokenOwner4 } = this.signers

    //let admin mint
    await contractOwner.withContract.mint(1, tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(1)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.tokenURI(1)).to.equal('https://ipfs.io/ipfs/Qm123abc/0.json')
    expect(await contractOwner.withContract.collectionSupply(1)).to.equal(1)

    //let someone buy
    await tokenOwner2.withContract.buy(2, { value: ethers.utils.parseEther('0.10') })
    expect(await contractOwner.withContract.ownerOf(2)).to.equal(tokenOwner2.address)
    expect(await contractOwner.withContract.tokenURI(2)).to.equal('https://ipfs.io/ipfs/Qm123abc')
    expect(await contractOwner.withContract.collectionSupply(2)).to.equal(1)

    //let someone gift
    await tokenOwner1.withContract.buyFor(1, tokenOwner3.address, { value: ethers.utils.parseEther('0.05') })
    expect(await contractOwner.withContract.ownerOf(3)).to.equal(tokenOwner3.address)
    expect(await contractOwner.withContract.tokenURI(3)).to.equal('https://ipfs.io/ipfs/Qm123abc/1.json')
    expect(await contractOwner.withContract.collectionSupply(1)).to.equal(2)

    //let someone authorize
    const message1 = hashToken(1, tokenOwner4.address)
    const signature1 = await contractOwner.signMessage(message1)
    await tokenOwner4.withContract.authorize(1, signature1)
    expect(await contractOwner.withContract.ownerOf(4)).to.equal(tokenOwner4.address)
    expect(await contractOwner.withContract.tokenURI(4)).to.equal('https://ipfs.io/ipfs/Qm123abc/2.json')
    expect(await contractOwner.withContract.collectionSupply(1)).to.equal(3)

    //let someone authorize for someone
    const message2 = hashToken(1, tokenOwner3.address)
    const signature2 = await contractOwner.signMessage(message2)
    await tokenOwner1.withContract.authorizeFor(1, tokenOwner3.address, signature2)
    expect(await contractOwner.withContract.ownerOf(5)).to.equal(tokenOwner3.address)
    expect(await contractOwner.withContract.tokenURI(5)).to.equal('https://ipfs.io/ipfs/Qm123abc/3.json')
    expect(await contractOwner.withContract.collectionSupply(1)).to.equal(4)
  })

  it('Should prevent minting past the size', async function () {
    const { contractOwner, tokenOwner1 } = this.signers

    await expect(
      contractOwner.withContract.mint(1, tokenOwner1.address)
    ).to.be.revertedWith('Collection filled')

    await expect(
      contractOwner.withContract.buy(1, { value: ethers.utils.parseEther('0.05') })
    ).to.be.revertedWith('Collection filled')

    await expect(
      contractOwner.withContract.buyFor(1, tokenOwner1.address, { value: ethers.utils.parseEther('0.05') })
    ).to.be.revertedWith('Collection filled')

    const message = hashToken(1, tokenOwner1.address)
    const signature = await contractOwner.signMessage(message)
    await expect(
      contractOwner.withContract.authorize(1, signature)
    ).to.be.revertedWith('Collection filled')
    await expect(
      contractOwner.withContract.authorizeFor(1, tokenOwner1.address, signature)
    ).to.be.revertedWith('Collection filled')
  })

  it('Should not mint if wrong amount', async function () {
    const { contractOwner, tokenOwner1 } = this.signers

    await expect(
      contractOwner.withContract.buy(2, { value: ethers.utils.parseEther('0.05') })
    ).to.be.revertedWith('Amount sent is not correct')

    await expect(
      contractOwner.withContract.buyFor(2, tokenOwner1.address, { value: ethers.utils.parseEther('0.05') })
    ).to.be.revertedWith('Amount sent is not correct')
  })

  it('Should withdraw', async function () {
    const { contractOwner } = this.signers

    const startingBalance = parseFloat(
      ethers.utils.formatEther(await contractOwner.getBalance())
    )

    await contractOwner.withContract.withdraw()
    
    expect(parseFloat(
      ethers.utils.formatEther(await contractOwner.getBalance())
      //also less gas
    ) - startingBalance).to.be.above(0.1495)
  })
})