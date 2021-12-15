const fs = require("fs");
require('dotenv').config()
const mergeImg = require('merge-img');
const uncommonParts = require('./parts/parts-uncommon')
const veryUncommonParts = require('./parts/parts-veryuncommon')
const rareParts = require('./parts/parts-rare')
const epicParts = require('./parts/parts-epic')
const legendaryParts = require('./parts/parts-legendary')

const descriptions = require('./descriptions');
const customSuperRare = require('./custom-super-rare');

const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const inputSupFolder = "./super-rares";
// const outputFolder = "./generated-corgis";
const outputFolder = "./outputs/generated-wolf";
const outputCharacterJSON = "./outputs/metadata.json";
const outputAttributes = "./outputs/attributes.json";
const outputTiers = "./outputs/tiers.json";
const totalTiers = "./outputs/total-tiers.json";
const sup = "./outputs/sup.json";
const falseFile = "./outputs/false.json";
const dnaList = "./outputs/dna-list.json";

const desiredCount = 500;

let ext = ".png";

const uploadToPinata = false;
const includeRares = false;

let characters = [];
  // Save attributes and generate map of attributes to saved array index
let attrArray = [];
let tiersArray = [];
let approvingCorgiTiers = {
  uncommon: 0,
  veryUncommon: 0,
  rare: 0,
  epic: 0,
}

// approving = common, disapproving = uncommon, rare = rare/legendary 
const tiers = ['uncommon','veryuncommon','rare','epic', 'legendary'];

// 65%, 30%, 4%
const tiersWeight = [51, 24, 16, 8, 1];
const totalWeight = 100;

let weightedTiers;
let supArray = [];
let ddnaList = [];
let falseDna = 0;

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
    console.log("🚀 ~ file: generate-wolf.js ~ line 83 ~ codeArr.forEach ~ _index", _index)
    console.log("🚀 ~ file: generate-wolf.js ~ line 106 ~ codeArr.forEach ~ code", code)
    if(code.tier === 'uncommon') {
      tier = uncommonParts;
    } else if (code.tier === 'veryuncommon') {
      tier = veryUncommonParts;
    } else if (code.tier === "rare"){
      tier = rareParts;
    } else if(code.tier === "epic") {
      tier = epicParts;
    } else {
      tier = legendaryParts;
    }

    // if (_index === 0) {
    //   if(code.code === 5 || code.code === 7) {
    //     ext = '.jpg';
    //     const img = {
    //       src: `./face-parts-${code.tier}/${tier[_index].name}${code.code}${ext}`,
    //       offsetX: tier[_index].offset.x,
    //       offsetY: tier[_index].offset.y,
    //     }
    
    //     images.push(img);
    //   } else {
    //     const img = {
    //       src: `./face-parts-${code.tier}/${tier[_index].name}${code.code}${ext}`,
    //       offsetX: tier[_index].offset.x,
    //       offsetY: tier[_index].offset.y,
    //     }
    //     images.push(img);
    //   }
    // } 

    if(_index === 4 || _index === 5 || _index === 6) {
      if(code.code !== 0) {
        const img = {
          src: `./face-parts-${code.tier}/${tier[_index].name}${code.code}${ext}`,
          offsetX: tier[_index].offset.x,
          offsetY: tier[_index].offset.y,
        }
    
        images.push(img);
      }
    } else {
      const img = {
        src: `./face-parts-${code.tier}/${tier[_index].name}${code.code}${ext}`,
        offsetX: tier[_index].offset.x,
        offsetY: tier[_index].offset.y,
      }
  
      images.push(img);
    }
  });

  console.log("🚀 ~ file: generate-wolf.js ~ line 128 ~ saveFaceByCode ~ images", images)
  await mergeImagesToPng(images, outFile);
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
    name: `High Street Wolf Society #${imgCount}`,
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
    if(codeAr.tier === 'uncommon') {
      tierCount.approving+=1;
      if(uncommonParts[_index].attrNames[codeAr.code] !== ''){
        const type = uncommonParts[_index].name.split('/')[1];
        if(type === 'Earaccessory') {
          c.attributes.push({trait_type: 'Ear Accessory', value: uncommonParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: uncommonParts[_index].name.split('/')[1], value: uncommonParts[_index].attrNames[codeAr.code]});
        }
      }
    } else if(codeAr.tier === 'veryuncommon') {
      tierCount.disapproving+=1;
      if(veryUncommonParts[_index].attrNames[codeAr.code] !== ''){ 
        const type = veryUncommonParts[_index].name.split('/')[1];
        if(type === 'Earaccessory') { 
          c.attributes.push({trait_type: 'Ear Accessory', value: veryUncommonParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: veryUncommonParts[_index].name.split('/')[1], value: veryUncommonParts[_index].attrNames[codeAr.code]});
        }
      }
    } else if(codeAr.tier === 'rare') {
      tierCount.rare+=1;
      if(rareParts[_index].attrNames[codeAr.code] !== '') {
        const type = rareParts[_index].name.split('/')[1]
        if(type === 'Earaccessory') { 
          c.attributes.push({trait_type: 'Ear Accessory', value: rareParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: rareParts[_index].name.split('/')[1], value: rareParts[_index].attrNames[codeAr.code]});
        }
      }
    } else if (codeAr.tier === "epic") {
      tierCount.rare+=1;
      if(epicParts[_index].attrNames[codeAr.code] !== '') {
        const type = epicParts[_index].name.split('/')[1]
        if(type === 'Earaccessory') { 
          c.attributes.push({trait_type: 'Ear Accessory', value: epicParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: epicParts[_index].name.split('/')[1], value: epicParts[_index].attrNames[codeAr.code]});
        }
      }
    } else {
      tierCount.rare+=1;
      if(legendaryParts[_index].attrNames[codeAr.code] !== '') {
        const type = legendaryParts[_index].name.split('/')[1]
        if(type === 'Earaccessory') { 
          c.attributes.push({trait_type: 'Ear Accessory', value: legendaryParts[_index].attrNames[codeAr.code]});
        } else {
          c.attributes.push({trait_type: legendaryParts[_index].name.split('/')[1], value: legendaryParts[_index].attrNames[codeAr.code]});
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
  // c.description = descriptions.find(desc => desc.tier === tier).description;
  
  return c;
}

const isDnaUnique = async (dna) => {
  let foundDna = ddnaList.find((i) => i.join('') === dna.join(''));
  console.log("🚀 ~ file: generate-corgis-no-ipfs.js ~ line 306 ~ isDnaUnique ~ foundDna", foundDna)
  return foundDna === undefined ? true : false;
};

const getnewRandom = (numbers) => {
  return numbers[Math.floor(Math.random()*numbers.length)];
}

async function generateCorgis() {
  // generate all tiers
  weightedTiers = await generateTiers();
  // Array that lists all characters
  // fs.writeFileSync(sup, JSON.stringify(supArray, null, 2));

  let imgCount = 0;
  let supIndex = 6;
  const fur18 = [1,6,8];
  const fur15 = [3,5,8];
  const bg8 = [15, 27, 31, 39, 41];

  const fur14outfits = [0,3,5,10,11,14,16,18,20,26];
  const fur1516outfits = [0,13,14,16,18,26];
  const fur18outfits = [0,2,6,10,13,17,30,36,39];
  const fur1920outfits = [0,13,14,16,18,26];

  const genOutfits = [0,1,2,3,7,9,10,11,12,13,14,16,18,19,20,26,28,30,39];
  const plainOutfits = [0,4,5,6,8,15,17,21,22,23,24,25,27,29,31,32,33,34,35,36,37,38];
  const uncommon = [0,1,2,3,4,5,6,7];
  const unverycommon = [0,1,2,3,4,5,6];
  const veryuncommon = [0,1,2,3,4,5,6,7,8,9,10];

  while(imgCount < desiredCount) {
    codeArr = [];
    let dna = [];

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
      let isUnique;

      do {
        dna = [];
        const randomTier = await getRandomInt(totalWeight);
        console.log("🚀 ~ file: generate-wolf.js ~ line 359 ~ generateCorgis ~ randomTier", randomTier)
        const tier = weightedTiers[randomTier];
        console.log("🚀 ~ file: generate-wolf.js ~ line 361 ~ generateCorgis ~ tier", tier)
        approvingCorgiTiers[tier]+=1;
        for (let i=0; i < 7; i++) {
          if(tier === 'uncommon'){
            let random = generateRandomNumber(0, uncommonParts[i].count - 1);
            if(i === 1) {
              if(random === 6 && codeArr[0].code === 8) {
                random = 0
              }
            } else if (i === 3) {
              // mouth 13-18
              if(random >= 13 && random <= 18) {
                codeArr[0].code = 5;
              }
            } else if (i === 6) {
              if(uncommon.includes(codeArr[1].code) || unverycommon.includes(codeArr[1].code)) {
                let newrandom = getnewRandom(genOutfits);
                random = newrandom;
              }
              // white fur
              if(random === 12) {
                let newRandom = getnewRandom([0,1,2,3,4]);
                codeArr[1].code = newRandom; 
              }
            }
            if(i === 2) {
              // leopard fur eyes
              if(codeArr[1].code === 7) {
                let newRandom;
                do {
                  newRandom = generateRandomNumber(0, uncommonParts[i].count - 1);
                } while ([8,20,21].includes(newRandom));
                random = newRandom;
              }
            }
            codeArr.push({ tier: tier, code: random});
          } else if(tier === 'veryuncommon'){
            let random = generateRandomNumber(0, veryUncommonParts[i].count - 1);
            // outfit
            if(i === 6) {
              if(veryuncommon.includes(codeArr[1].code)) {
                let newrandom = getnewRandom(genOutfits);
                random = newrandom;
              }
              // white fur
              if(random === 12) {
                let newRandom = getnewRandom([0,1,2,3,4]);
                codeArr[1].code = newRandom; 
              }
              if(codeArr[1].code === 7) {
                let newrandom = generateRandomNumber(0, 29);
                random = newrandom;
              } 
              if(codeArr[1].code === 9) {
                let newrandom = getnewRandom(fur14outfits);
                random = newrandom;
              } 
              if (codeArr[1].code === 10) {
                let newrandom = getnewRandom(fur1516outfits);
                random = newrandom;
              }
              
            }
            if(i === 2) {
              // leopard fur eyes
              if(codeArr[1].code === 6 || codeArr[1].code === 7 || codeArr[1].code === 8) {
                let newRandom;
                do {
                  newRandom = generateRandomNumber(0, veryUncommonParts[i].count - 1);
                } while ([3,7,13,14].includes(newRandom));
                random = newRandom;
              }
            }
            // head 
            // if(i === 5) {
            //   // fur14
            //   if(codeArr[1].code === 9) {
            //     random = 0;
            //   }
            //   // fur15
            //   if(codeArr[1].code === 10) {
            //     random = 0;
            //   }
            //   if(codeArr[1].code === 6 || codeArr[1].code === 7 || codeArr[1].code === 8) {
            //     let newRandom;
            //     do {
            //       newRandom = generateRandomNumber(0, veryUncommonParts[i].count - 1);
            //     } while ([1,2].includes(newRandom));
            //     random = newRandom;
            //   }
            // }
            codeArr.push({ tier: tier, code: random});
          } else if(tier === 'rare') {
            let random = generateRandomNumber(0, rareParts[i].count - 1);
            if(i === 1) {
              // fur gold and yellow background
              if(random === 9) {
                let newRandom = getnewRandom([0,1,3,2,4,6,7]);
                codeArr[0].code = newRandom;
              }
            }
            if(i === 2) {
              // fur 17 eyes
              if(codeArr[1].code === 7) {
                let newRandom;
                do {
                  newRandom = generateRandomNumber(0, rareParts[i].count - 1);
                } while ([8,20,21].includes(newRandom));
                random = newRandom;
              }
              // fur 18 eyes
              if(codeArr[1].code === 8) {
                let newRandom;
                do {
                  newRandom = generateRandomNumber(0, rareParts[i].count - 1);
                } while ([31,32,33].includes(newRandom));
                random = newRandom;
              }
            }
            // head 
            if(i === 5) {
              if(codeArr[1].code === 6) {
                random = 0;
              }
              if(codeArr[1].code === 7) {
                let newRandom = getnewRandom([3,8,11]);
                random = newRandom;
              }
              if(codeArr[1].code === 9) {
                random = 0;
              }
              if(codeArr[1].code === 8) {
                random = 0;
              }

              if(random === 14 || random === 15 || random === 16) {
                let newRandom = getnewRandom([0,1,2,3,4,5]);
                codeArr[1].code = newRandom;
              }
              
            }
            // ears
            if(i === 4) {
              if(codeArr[1].code === 9) {
                random = 0;
              }
              if(codeArr[1].code === 8) {
                random = 0;
              }
              if(codeArr[1].code === 7) {
                random = 0;
              }
            }
            if(i === 3) {
              // fur17 smoke and skeleton
              if(codeArr[1].code === 7) {
                let newRandom = getnewRandom([0,3]);
                random = newRandom;
              }
            }

            // outfits
            if(i === 6) {
              if(codeArr[1].code >= 0 &&  codeArr[1].code <= 9) {
                let newrandom = getnewRandom(genOutfits);
                random = newrandom;
              }
              // white fur
              if(random === 12) {
                let newRandom = getnewRandom([0,1,2,3,4]);
                codeArr[1].code = newRandom; 
              }
              // diamond
              if(codeArr[1].code === 6) {
                let newRandom = getnewRandom(fur1516outfits);
                random = newRandom;
              }

              // fur17 smoke and skeleton
              if(codeArr[1].code === 7) {
                let newRandom;
                do {
                  newRandom = generateRandomNumber(0, rareParts[i].count - 1);
                } while ([18,26,39].includes(newRandom));
                random = newRandom;
              }

              // stardust
              if(codeArr[1].code === 8) {
                let newRandom = getnewRandom(fur18outfits);
                random = newRandom;
              }

              // gold
              if(codeArr[1].code === 9) {
                let newRandom = getnewRandom(fur1920outfits);
                random = newRandom;
              }
            }
            codeArr.push({ tier: tier, code: random});
          } else if (tier === 'epic') {
            let random = generateRandomNumber(0, epicParts[i].count - 1);
            if(i === 1) {
              if(random === 9) {
                let newRandom = getnewRandom(fur18);
                codeArr[0].code = newRandom;
              } else if (random === 10 && codeArr[0].code === 8){
                const newRandom = generateRandomNumber(0, 7);
                codeArr[0].code = newRandom;
              } 
            }

            if(i === 6) {
              // white fur
              if(random === 12) {
                let newRandom = getnewRandom([0,1,2,3,4]);
                codeArr[1].code = newRandom; 
              }
            }
            codeArr.push({ tier: tier, code: random});
          } else {
            let random = generateRandomNumber(0, legendaryParts[i].count - 1);
            if(i === 6) {
              // emerald
              if(codeArr[1].code === 0) {
                let newRandom = getnewRandom(fur1920outfits);
                random = newRandom;
              }
            }
            codeArr.push({ tier: tier, code: random});
          }
        }
        if(codeArr[5].code !== 0) {
          codeArr[4].code = 0;
        }

        // bg 8 x outfit 15,27,31,38,41
        if(bg8.includes(codeArr[6].code)) {
          let newRandom = generateRandomNumber(0, 7);
          codeArr[0].code = newRandom;
        }

        if(codeArr[1].tier === 'epic' && codeArr[1].code === 8) {
          codeArr[3].code = 0;
        }
        
        codeArr.forEach(element => {
          dna.push(element.code);
        });
        isUnique = await isDnaUnique(dna);
        ddnaList.push(dna);
        
        if(!isUnique) falseDna+=1;
        console.log("🚀 ~ file: generate-corgis-dna.js ~ line 533 ~ generateCorgis ~ unique", isUnique)
        
      } while (!isUnique);

      fs.readFile(dnaList, async function (err, data) {
        var dnaJson = JSON.parse(data);
        dnaJson.push(dna);

        fs.writeFileSync(dnaList, JSON.stringify(dnaJson))
      })

      // generate image
      await saveFaceByCode(codeArr, `${outputFolder}/wolf${imgCount}${ext}`);
  
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
        fs.readFile(outputCharacterJSON, function (err, data) {
          var metadata = JSON.parse(data);
          metadata.push(`https://approvingcorgis.mypinata.cloud/ipfs/${jsonPinResult.IpfsHash}`)
      
          fs.writeFileSync(outputCharacterJSON, JSON.stringify(metadata, null, 2))
        })
      } else {
        characters.push(ch);
      }
    }

    imgCount++;
    
  }

  // fs.writeFileSync(outputCharacterJSON, JSON.stringify(characters, null, 2));
  fs.writeFileSync(outputAttributes, JSON.stringify(attrArray, null, 2));
  fs.writeFileSync(outputTiers, JSON.stringify(tiersArray, null, 2));
  fs.writeFileSync(totalTiers, JSON.stringify(approvingCorgiTiers, null, 2));
  fs.writeFileSync(falseFile, JSON.stringify({falseDna}, null, 2));
}

async function main() {
  await generateCorgis();
}

main();