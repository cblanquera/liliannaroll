// $ node scripts/nft.storage.js

const fs = require('fs')
const path = require('path')

const { NFTStorage, File, Blob } = require('nft.storage')
require('dotenv').config()

const collections = require('../data/collections.json')
const client = new NFTStorage({ token: process.env.NFT_STORAGE })

async function uploadCollection(folder, collection) {
  const preview = path.resolve(__dirname, '../data', folder, 'preview.jpg')
  const videos = path.resolve(__dirname, '../data', folder, 'videos')
  const jsons = path.resolve(__dirname, '../data', folder, 'json')
  if (!fs.existsSync(videos)) {
    throw new Error(`data/${folder}/videos folder missing`)
  } else if (!fs.existsSync(jsons)) {
    throw new Error(`data/${folder}/json folder missing`)
  } else if (!fs.existsSync(preview)) {
    throw new Error(`data/${folder}/preview.jpg missing`)
  }

  //upload preview
  console.log(`Uploading ${folder}/preview.jpg ...`)
  const previewCID = await client.storeBlob(new Blob([await fs.promises.readFile(preview)]))
  console.log(`${folder}/preview.jpg is now https://ipfs.io/ipfs/${previewCID}`)

  const jsonFolder = []

  for (let i = 0; i < collection.limit; i++) {
    const index = i + 1
    const video = path.join(videos, `${index}.mp4`)
    if (!fs.existsSync(video)) {
      console.error(`Skipping: ${folder}/videos/${path.basename(video)} missing.`)
      continue;
    }
    const json = path.join(jsons, `${i}.json`)
    if (!fs.existsSync(json)) {
      //upload video
      console.log(`Uploading ${folder}/videos/${path.basename(video)} ...`)
      const data = await fs.promises.readFile(video)
      const cid = await client.storeBlob(new Blob([data]))
      console.log(`${folder}/videos/${path.basename(video)} is now https://ipfs.io/ipfs/${cid}`)
      //update json file
      const jsondata = Object.assign({}, collection.metadata)
      jsondata.image = `https://ipfs.io/ipfs/${previewCID}`
      jsondata.animation_url = `https://ipfs.io/ipfs/${cid}`

      jsondata.name = json.name.replace('{ID}', index)
      jsondata.description = json.description.replace('{ID}', index)
      jsondata.external_url = json.external_url.replace('{ID}', index)

      console.log(`Updating ${folder}/json/${path.basename(json)} ...`)
      fs.writeFileSync(json, JSON.stringify(jsondata, null, 2))
    }
    
    jsonFolder.push(
      new File([await fs.promises.readFile(json)], path.basename(json))
    )
  }

  console.log('Uploading all json...')
  const jsonCID = await client.storeDirectory(jsonFolder)
  console.log(`JSON for ${folder} folder found in https://ipfs.io/ipfs/${jsonCID}`)
}

function truncateJson() {
  for (const folder in collections) {
    fs.rmdirSync(
      path.resolve(__dirname, '../data', folder, 'json'), 
      { recursive: true }
    );
  }
}

async function main() {
  //truncateJson() //uncomment if starting over
  for (const folder in collections) {
    await uploadCollection(folder, collections[folder])
  }

  console.log('Done!')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
