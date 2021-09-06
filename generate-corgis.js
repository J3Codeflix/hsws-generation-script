const fs = require("fs");
require('dotenv').config()
const mergeImg = require('merge-img');
const approvingParts = require('./parts-approving')
const disapprovingParts = require('./parts-disapproving')
const rareParts = require('./parts-rare')
const descriptions = require('./descriptions');

const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const outputFolder = "./generated-corgis";
const outputCharacterJSON = "./outputs/metadata.json";
const outputAttributes = "./outputs/attributes.json";
const outputTiers = "./outputs/tiers.json";
const totalTiers = "./outputs/total-tiers.json";

const desiredCount = 30;

const ext = ".png";

const uploadToPinata = true;
const isLive = false;

let characters = [];
  // Save attributes and generate map of attributes to saved array index
let attrArray = [];
let tiersArray = [];
let approvingCorgiTiers = {
  approving: 0,
  disapproving: 0,
  rare: 0,
}

// approving = common, disapproving = uncommon, rare = rare/legendary 
const tiers = ['approving','disapproving','rare'];

// 65%, 30%, 4%
const tiersWeight = [65, 30, 4];
const totalWeight = 99;

let weightedTiers;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
}

function mergeImagesToPng(images, output) {
  return new Promise(function(resolve, reject) {
    mergeImg(images)
    .then((img) => {
      // Save image as file
      img.write(output, () => {
        console.log(`Image ${output} saved`);
        resolve();
      });
    }).catch(err => {
      console.log("🚀 ~ file: generate-corgis.js ~ line 109 ~ .then ~ err", err)
    });
  });
}

async function saveFaceByCode(codeArr, outFile) {
  let images = [];
  let tier;
  codeArr.forEach((code, _index) => {
    if(code.tier === 'approving') {
      tier = approvingParts;
    } else if (code.tier === 'disapproving') {
      tier = disapprovingParts;
    } else {
      tier = rareParts;
    }
    const img = {
      src: `./face-parts-${code.tier}/${tier[_index].name}${code.code}${ext}`,
      offsetX: tier[_index].offset.x,
      offsetY: tier[_index].offset.y,
    }

    images.push(img);
  });
  // Generate image
  await mergeImagesToPng(images, outFile);
}

async function generateTiers() {
   
  const weighedTiers = new Array(); 
  var currentTier=0
  
  while (currentTier<tiers.length){ 
    for (i=0; i<tiersWeight[currentTier]; i++)
    weighedTiers[weighedTiers.length]=tiers[currentTier]
    currentTier++
  }

  tiers.forEach(tier => {
    tiersArray.push({tier, count: 0});
  })
  
  return weighedTiers;
}

async function createAttributesCount() {
  approvingParts.forEach(approving => {
    approving.attrNames.forEach(attribute => {
      if(attribute === '') {
        if(!attrArray.some(attr => attr.attribute === '')) {
          attrArray.push({attribute, count: 0 })
        }
      } else {
        attrArray.push({attribute, count: 0 })
      }
    })
  });
  
  disapprovingParts.forEach(approving => {
    approving.attrNames.forEach(attribute => {
      if(attribute === '') {
        if(!attrArray.some(attr => attr.attribute === '')) {
          attrArray.push({attribute, count: 0 })
        }
      } else {
        attrArray.push({attribute, count: 0 })
      }
      
    })
  });
  
  rareParts.forEach(approving => {
    approving.attrNames.forEach(attribute => {
      if(attribute === '') {
        if(!attrArray.some(attr => attr.attribute === '')) {
          attrArray.push({attribute, count: 0 })
        } 
      } else {
        attrArray.push({attribute, count: 0 })
      }
    })
  });
}

const getPair = (part, tier) => {
  if(tier === 'approving') {
    if(part > 0 && part <= 22) {
      return part;
    } else {
      return -1;
    }
  } else if(tier === 'disapproving') {
    if(part > 0 && part <= 17) {
      return part;
    } else {
      return -1;
    }
  } else if (tier === 'rare') {
    switch (part) {
      case 5:
        return 14;
      case 45:
        return 1;
      case 46:
        return 3;
      case 47:
        return 9;
      case 48:
        return 13;
      default:
        return -1;
    }
  }
}

async function generateMetadata(imgCount, codeArr, imgPin) {
  c = {
    name: `Approving Corgis #${imgCount}`,
    description: "", 
    image: imgPin,
    attributes: [],
  };

  let tierCount = {
    approving: 0,
    disapproving: 0,
    rare: 0,
  }

  codeArr.forEach((codeAr, _index) => {
    tiersArray.find(tier => tier.tier === codeAr.tier).count+=1;
    if(codeAr.tier === 'approving') {
      tierCount.approving+=1;
      let attrName = approvingParts[_index].attrNames[codeAr.code];
      attrArray.find(attr => attr.attribute === attrName).count+=1;
      if(approvingParts[_index].attrNames[codeAr.code] !== ''){
        c.attributes.push({trait_type: approvingParts[_index].name.split('/')[1], value: approvingParts[_index].attrNames[codeAr.code]});
      }
    } else if(codeAr.tier === 'disapproving') {
      tierCount.disapproving+=1;
      let attrName = disapprovingParts[_index].attrNames[codeAr.code];
      attrArray.find(attr => attr.attribute === attrName).count+=1;
      if(disapprovingParts[_index].attrNames[codeAr.code] !== ''){ 
        c.attributes.push({trait_type: disapprovingParts[_index].name.split('/')[1], value: disapprovingParts[_index].attrNames[codeAr.code]});
      }
    } else {
      tierCount.rare+=1;
      let attrName = disapprovingParts[_index].attrNames[codeAr.code];
      attrArray.find(attr => attr.attribute === attrName).count+=1;
      if(rareParts[_index].attrNames[codeAr.code] !== '') {
        c.attributes.push({trait_type: rareParts[_index].name.split('/')[1], value: rareParts[_index].attrNames[codeAr.code]});
      }
    }
  });

  c.attributes.push({trait_type: 'Tier', value: codeArr[2].tier.charAt(0).toUpperCase() + codeArr[2].tier.slice(1)});

  const tier = codeArr[0].tier;
  c.description = descriptions.find(desc => desc.tier === tier);
  
  return c;
}

async function generateCorgis() {
  // generate all tiers
  weightedTiers = await generateTiers();
  // Array that lists all characters
  await createAttributesCount();

  let imgCount = 0;
  let excludedRareFace = [0,1,5,6];
  let excludedRareOutfit = [1,3,9,13];
  let excludedDisapprovingOutfits = [11,13, 14, 15];
  let excludedDisapprovingFaces = [2,9];

  while(imgCount < desiredCount) {
    codeArr = [];
    let outfit = 0;
    let noEyewear = false;
    // generate code array per tiers
    const randomTier = await getRandomInt(totalWeight);
    const tier = weightedTiers[randomTier];
    // const tier = 'rare';
    approvingCorgiTiers[tier]+=1;
    for (let i=0; i < 8; i++) {
      if(tier === 'approving'){
        let random = generateRandomNumber(0, approvingParts[i].count - 1);
        
        if(i === 6) {
          outfit = getPair(random, tier);
          codeArr.push({ tier: tier, code: random});
          if(random === 6) {
            codeArr[5].code = 0;
          }

          if(random === 14) {
            const chance = generateRandomNumber(0, 1);
            if(chance === 0) {
              codeArr[5].code = 0;
            }else{
              codeArr[5].code =16;
            }
          }

        } else if(i === 7) {
          if(outfit === -1) {
            random = generateRandomNumber(23, approvingParts[7].count - 1);
            codeArr.push({ tier: tier, code: random});
          } else {
            codeArr.push({ tier: tier, code: outfit});
          }
        } else {
          codeArr.push({ tier: tier, code: random});
        }
      } else if(tier === 'disapproving'){
        let random = generateRandomNumber(0, disapprovingParts[i].count - 1);
        
        if(i === 6) {
          outfit = getPair(random, tier);
          codeArr.push({ tier: tier, code: random});
          if(random === 1) {
            const chance = generateRandomNumber(0, 1);
            if(chance === 0) {
              codeArr[5].code = 0;
            }else{
              codeArr[5].code =16;
            }
          }
          if(random === 3){
            codeArr[5].code = 0;
          }
          if(excludedDisapprovingOutfits.includes(random)) {
            let newFace;
            do {
              newFace = generateRandomNumber(0, rareParts[2].count - 1);
            } while (excludedDisapprovingFaces.includes(newFace));
            codeArr[2].code = newFace;
          }
        } else if(i === 7) {
          if(outfit === -1) {
            random = generateRandomNumber(40, disapprovingParts[7].count - 1);
            codeArr.push({ tier: tier, code: random});
          } else {
            codeArr.push({ tier: tier, code: outfit});
          }
        } else {
          codeArr.push({ tier: tier, code: random});
        }
      } else {
        let random = generateRandomNumber(0, rareParts[i].count - 1);

        if(i === 2) {
          if(excludedRareFace.includes(random)) {
            noEyewear = true;
          }
          codeArr.push({ tier: tier, code: random});
        } else if(i === 5) {
          if(noEyewear) {
            codeArr.push({ tier: tier, code: 0});
          } else {
            codeArr.push({ tier: tier, code: random});
          }
        } else if (i === 6) {
          outfit = getPair(random, tier);
          codeArr.push({ tier: tier, code: random});
          if(random === 5) {
            const face = generateRandomNumber(0, 4);
            codeArr[2].code = face;
          }
        } else if(i === 7) {
          if(outfit === -1) {
            let newOutfit
            do {
              newOutfit = generateRandomNumber(0, rareParts[7].count - 1);
            } while (excludedRareOutfit.includes(newOutfit));
            codeArr.push({ tier: tier, code: newOutfit});
          } else {
            codeArr.push({ tier: tier, code: outfit});
          }
        } else {
          codeArr.push({ tier: tier, code: random});
        }
      }
    }
    // generate image
    await saveFaceByCode(codeArr, `${outputFolder}/approving-corgi${imgCount}${ext}`);

    // upload to IPFS
    let imgPinResult;
    if(uploadToPinata) {
      const result = await pinata.pinFromFS(`${outputFolder}/approving-corgi${imgCount}${ext}`);
      imgPinResult = `https://approvingcorgis.mypinata.cloud/ipfs/${result.IpfsHash}`
    }
    // Add character with attributes to metadata
    const ch = await generateMetadata(imgCount, codeArr, imgPinResult);

    if(uploadToPinata) {
      const options = {
        pinataMetadata: {
          name: `Approving Corgis #${imgCount}`,
        },
      }
      const jsonPinResult = await pinata.pinJSONToIPFS(ch, options);
      characters.push(`https://approvingcorgis.mypinata.cloud/ipfs/${jsonPinResult.IpfsHash}`);
    } else {
      characters.push(ch);
    }
    imgCount++;
    
  }

  fs.writeFileSync(outputCharacterJSON, JSON.stringify(characters, null, 2));
  fs.writeFileSync(outputAttributes, JSON.stringify(attrArray, null, 2));
  fs.writeFileSync(outputTiers, JSON.stringify(tiersArray, null, 2));
  fs.writeFileSync(totalTiers, JSON.stringify(approvingCorgiTiers, null, 2));
}

async function main() {
  await generateCorgis();
}

main();