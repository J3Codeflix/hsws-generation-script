const fs = require("fs");
require('dotenv').config()
const mergeImg = require('merge-img');
const approvingParts = require('./parts-approving')
const disapprovingParts = require('./parts-disapproving')
const rareParts = require('./parts-rare')
const descriptions = require('./descriptions');
const customSuperRare = require('./custom-super-rare');

const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const inputSupFolder = "./super-rares";
const outputFolder = "./generated-corgis";
const outputCharacterJSON = "./outputs/metadata.json";
const outputAttributes = "./outputs/attributes.json";
const outputTiers = "./outputs/tiers.json";
const totalTiers = "./outputs/total-tiers.json";
const sup = "./outputs/sup.json";

const desiredCount = 10;

const ext = ".png";

const uploadToPinata = false;
const includeRares = false;

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
let supArray = [];

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

  if(codeArr[0].tier === 'disapproving' && codeArr[7].code === 15) {
    console.log('Hit space suit????? =====>>>>')
    const newImages = await swapArrayElements(images, 6, 7);
    await mergeImagesToPng(newImages, outFile);
  } else {
    await mergeImagesToPng(images, outFile);
  }
  // Generate image
}

async function swapArrayElements(arr, indexA, indexB) {
  var temp = arr[indexA];
  arr[indexA] = arr[indexB];
  arr[indexB] = temp;
  return arr;
};

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
        const type = approvingParts[_index].name.split('/')[1];
        if(type === 'Earaccessory') {
          c.attributes.push({trait_type: 'Ear Accessory', value: approvingParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: approvingParts[_index].name.split('/')[1], value: approvingParts[_index].attrNames[codeAr.code]});
        }
      }
    } else if(codeAr.tier === 'disapproving') {
      tierCount.disapproving+=1;
      let attrName = disapprovingParts[_index].attrNames[codeAr.code];
      attrArray.find(attr => attr.attribute === attrName).count+=1;
      if(disapprovingParts[_index].attrNames[codeAr.code] !== ''){ 
        const type = disapprovingParts[_index].name.split('/')[1];
        if(type === 'Earaccessory') { 
          c.attributes.push({trait_type: 'Ear Accessory', value: disapprovingParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: disapprovingParts[_index].name.split('/')[1], value: disapprovingParts[_index].attrNames[codeAr.code]});
        }
      }
    } else {
      tierCount.rare+=1;
      let attrName = disapprovingParts[_index].attrNames[codeAr.code];
      attrArray.find(attr => attr.attribute === attrName).count+=1;
      if(rareParts[_index].attrNames[codeAr.code] !== '') {
        const type = rareParts[_index].name.split('/')[1]
        if(type === 'Earaccessory') { 
          c.attributes.push({trait_type: 'Ear Accessory', value: rareParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: rareParts[_index].name.split('/')[1], value: rareParts[_index].attrNames[codeAr.code]});
        }
      }
    }
  });

  const chrome = generateRandomNumber(0, 9);
  if(chrome < 5) {
    c.attributes.push({trait_type: 'Chromosome', value: 'X'});
  } else {
    c.attributes.push({trait_type: 'Chromosome', value: 'Y'});
  }

  c.attributes.push({trait_type: 'Tier', value: codeArr[2].tier.charAt(0).toUpperCase() + codeArr[2].tier.slice(1)});

  const tier = codeArr[0].tier;
  c.description = descriptions.find(desc => desc.tier === tier).description;
  
  return c;
}

const generateSuperRareArray = async () => {
  for (let index = 0; index < 9; index++) {
    if(index === 0) {
      const randomNumber = generateRandomNumber(101, 999);
      supArray.push(randomNumber);
    } else if(index === 1) {
      const randomNumber = generateRandomNumber(1000, 1999);
      supArray.push(randomNumber);
    } else if(index === 2) {
      const randomNumber = generateRandomNumber(2000, 2999);
      supArray.push(randomNumber);
    } else if(index === 3) {
      const randomNumber = generateRandomNumber(3000, 3999);
      supArray.push(randomNumber);
    } else if(index === 4) {
      const randomNumber = generateRandomNumber(4000, 4999);
      supArray.push(randomNumber);
    } else if(index === 5) {
      const randomNumber = generateRandomNumber(5000, 5999);
      supArray.push(randomNumber);
    } else if(index === 6) {
      const randomNumber = generateRandomNumber(6000, 7999);
      supArray.push(randomNumber);
    } else if(index === 7) {
      const randomNumber = generateRandomNumber(8000, 8999);
      supArray.push(randomNumber);
    } else if(index === 8) {
      const randomNumber = generateRandomNumber(9000, 9999);
      supArray.push(randomNumber);
    }
  }
}

async function generateCorgis() {
  // generate all tiers
  weightedTiers = await generateTiers();
  // Array that lists all characters
  await createAttributesCount();
  await generateSuperRareArray();
  
  console.log("🚀 ~ file: generate-corgis.js ~ line 306 ~ generateCorgis ~ supArray", supArray)

  let imgCount = 0;
  let supIndex = 0;
  let excludedRareFace = [0,1,5,6];
  let excludedRareOutfit = [1,3,9,13];
  let excludedDisapprovingOutfits = [11,13, 14, 15];
  let excludedDisapprovingFaces = [2,9];

  while(imgCount < desiredCount) {
    codeArr = [];
    let outfit = 0;
    let noEyewear = false;

    if(supArray.includes(imgCount)) {
      // upload to IPFS
      
      // upload to IPFS
      let imgPinResult;
      if(uploadToPinata) {
        const result = await pinata.pinFromFS(`${inputSupFolder}/super-rare${supIndex}${ext}`);
        imgPinResult = `https://approvingcorgis.mypinata.cloud/ipfs/${result.IpfsHash}`
      } else {
        fs.copyFile(`${inputSupFolder}/super-rare${supIndex}${ext}`,`${outputFolder}/approving-corgi${imgCount}${ext}`, 1 ,(err) =>{
          console.log("🚀 ~ file: generate-corgis.js ~ line 290 ~ fs.copyFile ~ err", err)
        })
      }
      // Add character with attributes to metadata
      const ch = customSuperRare[supIndex];
  
      ch.name = `Approving Corgis #${imgCount}`;
      ch.image = imgPinResult;

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
      console.log(`Image approving-corgi${imgCount} saved`);
      supIndex+=1;

    } else {

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
  
            if(random === 5) {
              codeArr[5].code = 0;
            }
  
          } else if(i === 7) {
            if(outfit === -1) {
              random = generateRandomNumber(23, approvingParts[7].count - 1);
              codeArr.push({ tier: tier, code: random});
            } else {
              codeArr.push({ tier: tier, code: outfit});
            }
            if(codeArr[2].code === 13 || codeArr[2].code === 16) {
              codeArr[5].code = 0;
            }
          } else {
            codeArr.push({ tier: tier, code: random});
          }
        } else if(tier === 'disapproving'){
          let random = generateRandomNumber(0, disapprovingParts[i].count - 1);
          
          if(i === 6) {
            outfit = getPair(random, tier);
            codeArr.push({ tier: tier, code: random});
            if(random === 1 || random === 12) {
              const chance = generateRandomNumber(0, 1, 2);
              if(chance === 0) {
                codeArr[5].code = 0;
              } else if(chance === 1) { 
                codeArr[5].code = 19;
              }else{
                codeArr[5].code = 20;
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
              const face = generateRandomNumber(0, 2);
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
              if(outfit === 9 || outfit === 3) {
                console.log('is Dragooooooon or pressure suit')
                const face = generateRandomNumber(0, 2);
                codeArr[2].code = face;
                codeArr[5].code = 0;
              }
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
    }

    imgCount++;
    
  }

  fs.writeFileSync(outputCharacterJSON, JSON.stringify(characters, null, 2));
  fs.writeFileSync(outputAttributes, JSON.stringify(attrArray, null, 2));
  fs.writeFileSync(outputTiers, JSON.stringify(tiersArray, null, 2));
  fs.writeFileSync(totalTiers, JSON.stringify(approvingCorgiTiers, null, 2));
  fs.writeFileSync(sup, JSON.stringify(supArray, null, 2));
}

async function main() {
  await generateCorgis();
}

main();