const fs = require("fs");
require('dotenv').config()
const customMetadata = require('./custom-metadata');

const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const outputFolder = "./customs";
const outputCharacterJSON = "./outputs/customs.json";

const desiredCount = 3;

const ext = ".png";

let characters = [];
  // Save attributes and generate map of attributes to saved array index

async function generateCorgis() {
  let imgCount = 0;
  while(imgCount < desiredCount) {
    // generate image

    // upload to IPFS
    const result = await pinata.pinFromFS(`${outputFolder}/approving-corgi${imgCount}${ext}`);
    const imgPinResult = `https://approvingcorgis.mypinata.cloud/ipfs/${result.IpfsHash}`;

    // Add character with attributes to metadata
    const ch = customMetadata[imgCount];

    ch.image = imgPinResult;

    const options = {
      pinataMetadata: {
        name: `Approving Corgis #${imgCount}`,
      },
    }
    const jsonPinResult = await pinata.pinJSONToIPFS(ch, options);
    characters.push(`https://approvingcorgis.mypinata.cloud/ipfs/${jsonPinResult.IpfsHash}`);
    console.log(`SAVED ${imgCount}`)
    imgCount++;
    
  }

  fs.writeFileSync(outputCharacterJSON, JSON.stringify(characters,null,2));
}

async function main() {
  await generateCorgis();
}

main();