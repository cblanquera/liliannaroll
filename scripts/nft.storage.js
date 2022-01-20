const fs = require('fs')
const path = require('path')

const { NFTStorage, File, Blob } = require('nft.storage')
require('dotenv').config()

async function main() {
  const logo = path.resolve(__dirname, '../contract/logo.png')
  const contract = path.resolve(__dirname, '../contract/contract.json')
  const images = path.resolve(__dirname, '../build/images')
  const jsons = path.resolve(__dirname, '../build/json')
  if (!fs.existsSync(images)) {
    throw new Error('build/images folder missing')
  } else if (!fs.existsSync(jsons)) {
    throw new Error('build/json folder missing')
  } else if (!fs.existsSync(logo)) {
    throw new Error('contract/logo.png missing')
  } else if (!fs.existsSync(contract)) {
    throw new Error('contract/contract.json missing')
  }

  const jsonFolder = []
  const client = new NFTStorage({ token: process.env.NFT_STORAGE })

  //add contract.json
  const contractdata = require(contract);
  if (contractdata.image.indexOf('TODO') !== -1) {
    console.log('Uploading logo.png ...')
    const logoCID = await client.storeBlob(new Blob([
      await fs.promises.readFile(logo)
    ]))
    console.log(`logo.png is now https://ipfs.io/ipfs/${logoCID}`)
    
    contractdata.image = `https://ipfs.io/ipfs/${logoCID}`
    console.log('Updating contract.json ...')
    fs.writeFileSync(contract, JSON.stringify(contractdata, null, 2));
  }
  
  jsonFolder.push(
    new File([await fs.promises.readFile(contract)], path.basename(contract))
  )

  //loop through image files
  const files = await fs.promises.readdir(images);
  for( const name of files ) {
    const image = path.join(images, name)
    const imageStat = await fs.promises.stat( image )
    //if not a file
    if(!imageStat.isFile()) {
      console.error(`Skipping ${name}, not a file`)
      continue
    //if not a png
    } else if (path.extname(image) !== '.png') {
      console.error(`Skipping ${name}, not a png`)
      continue
    }

    const json = path.join(jsons, `${path.basename(name, '.png')}.json`)
    //if file doesnt exist
    if (!fs.existsSync(json)) {
      console.error(`Skipping ${name}, no matching ${path.basename(name, '.png')}.json found`)
      continue
    }
    const jsonStat = await fs.promises.stat( json )
    //if no matching json
    if(!jsonStat.isFile()) {
      console.error(`Skipping ${name}, no matching ${path.basename(name, '.png')}.json found`)
      continue
    }

    const jsondata = require(json)
    if (jsondata.image.indexOf('TODO') !== -1) {
      //upload image
      console.log(`Uploading ${name} ...`)
      const data = await fs.promises.readFile(image)
      const cid = await client.storeBlob(new Blob([data]))
      console.log(`${name} is now https://ipfs.io/ipfs/${cid}`)
      //update json file
      jsondata.image = `https://ipfs.io/ipfs/${cid}`
      console.log(`Updating ${path.basename(json)} ...`)
      fs.writeFileSync(json, JSON.stringify(jsondata, null, 2))
    } else {
      console.log(`${name} already uploaded to ${jsondata.image}`)
    }

    jsonFolder.push(
      new File([await fs.promises.readFile(json)], path.basename(json))
    )
  }

  console.log('Uploading all json...')
  const cid = await client.storeDirectory(jsonFolder)
  console.log(`JSON folder found in https://ipfs.io/ipfs/${cid}`)

  console.log('Done!')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
