const fs = require("fs");
require('dotenv').config()
const mergeImg = require('merge-img');
const approvingParts = require('./parts-approving')
const disapprovingParts = require('./parts-disapproving')
const epicParts = require('./parts-epic')

const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const outputFolder = "./generated-corgis";
const outputCharacterJSON = "./outputs/metadata.json";
const outputAttributes = "./outputs/attributes.json";
const outputTiers = "./outputs/tiers.json";
const totalTiers = "./outputs/total-tiers.json";

const desiredCount = 5;

const ext = ".png";

const uploadToPinata = false;

let characters = [];
  // Save attributes and generate map of attributes to saved array index
let attrArray = [];
let tiersArray = [];
let approvingCorgiTiers = {
  approving: 0,
  disapproving: 0,
  epic: 0,
}

// approving = common, disapproving = uncommon, epic = rare/legendary 
const tiers = ['approving','disapproving','epic'];

// 65%, 30%, 5%
const tiersWeight = [65, 30, 5];
const totalWeight = 100;

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
      tier = epicParts;
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
  
  epicParts.forEach(approving => {
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

const getPair = (part) => {
  switch (part) {
    case 1:
      return 1
    case 2:
      return 1
    case 6:
      return 2
    case 7:
      return 3
    case 8:
      return 4
    case 9:
      return 5
    case 10:
      return 6
    case 11:
      return 7
    case 12:
      return 8
    case 21:
      return 10
    case 22:
      return 10
    default:
      return 0
  }
}

async function generateMetadata(imgCount, codeArr, imgPin) {
  c = {
    name: `Approving Corgis #${imgCount}`,
    description: "9,999 adorable corgi #NFTs. Don’t worry, they won’t judge or disapprove of you...well, at least most of them won't.", 
    image: imgPin,
    attributes: [],
  };

  let tierCount = {
    approving: 0,
    disapproving: 0,
    epic: 0,
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
      tierCount.epic+=1;
      let attrName = disapprovingParts[_index].attrNames[codeAr.code];
      attrArray.find(attr => attr.attribute === attrName).count+=1;
      if(epicParts[_index].attrNames[codeAr.code] !== '') {
        c.attributes.push({trait_type: epicParts[_index].name.split('/')[1], value: epicParts[_index].attrNames[codeAr.code]});
      }
    }
  });

  if(tierCount.epic > 0) {
    c.attributes.push({trait_type: 'Tier', value: 'Epic'});
    approvingCorgiTiers.epic+=1;
  } else if (tierCount.disapproving >= 3){
    c.attributes.push({trait_type: 'Tier', value: 'Disapproving'});
    approvingCorgiTiers.disapproving+=1;
  } else {
    c.attributes.push({trait_type: 'Tier', value: 'Approving'});
    approvingCorgiTiers.approving+=1;
  }

  return c;
}

async function generateCorgis() {
  // generate all tiers
  weightedTiers = await generateTiers();
  // Array that lists all characters
  await createAttributesCount();

  let imgCount = 1;
  let excludedHeadwear = [1,2,3,4,5,6,7,8,10,18,50];

  while(imgCount < desiredCount + 1) {
    codeArr = [];
    let headWear = 0;

    // generate code array per tiers
    for (let i=0; i < 8; i++) {
      const randomTier = await getRandomInt(totalWeight);
      const tier = weightedTiers[randomTier];
      if(tier === 'approving'){
        let random = generateRandomNumber(0, approvingParts[i].count - 1);
        
        if(i === 5) {
          headWear = getPair(random);
          codeArr.push({ tier: tier, code: random});
        } else if(i === 7) {
          if(headWear === 0) {
            do {
              random = generateRandomNumber(0, approvingParts[i].count - 1);
            } while (excludedHeadwear.includes(random));
            codeArr.push({ tier: tier, code: random});
          } else {
            codeArr.push({ tier: tier, code: headWear});
          }
        } else {
          codeArr.push({ tier: tier, code: random});
        }
      } else if(tier === 'disapproving'){
        let random = generateRandomNumber(0, disapprovingParts[i].count - 1);
        
        if(i === 5) {
          headWear = getPair(random);
          codeArr.push({ tier: tier, code: random});
        } else if(i === 7) {
          if(headWear === 0) {
            do {
              random = generateRandomNumber(0, disapprovingParts[i].count - 1);
            } while (excludedHeadwear.includes(random));
            codeArr.push({ tier: tier, code: random});
          } else {
            codeArr.push({ tier: tier, code: headWear});
          }
        } else {
          codeArr.push({ tier: tier, code: random});
        }
      } else {
        let random = generateRandomNumber(0, epicParts[i].count - 1);
        
        if(i === 5) {
          headWear = getPair(random);
          codeArr.push({ tier: tier, code: random});
        } else if(i === 7) {
          if(headWear === 0) {
            do {
              random = generateRandomNumber(0, epicParts[i].count - 1);
            } while (excludedHeadwear.includes(random));
            codeArr.push({ tier: tier, code: random});
          } else {
            codeArr.push({ tier: tier, code: headWear});
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

  fs.writeFileSync(outputCharacterJSON, JSON.stringify(characters));
  fs.writeFileSync(outputAttributes, JSON.stringify(attrArray));
  fs.writeFileSync(outputTiers, JSON.stringify(tiersArray));
  fs.writeFileSync(totalTiers, JSON.stringify(approvingCorgiTiers));
}

async function main() {
  await generateCorgis();
}

main();