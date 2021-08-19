const fs = require("fs");
require('dotenv').config()
const mergeImg = require('merge-img');
const partTypes = require('./parts')
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const outputFolder = "./generated_corgis";
const outputCharacterJSON = "./outputs/metadata.json";
const outputAttributesJS = "./outputs/attributes.json";

const desiredCount = 10;
const totalFaces = 10000;

const ext = ".png";
const partFolder = "./face_parts";

const uploadToPinata = true;

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
    });
    // resolve();
  });
}

async function saveFaceByCode(codeArr, outFile) {
  let images = [];
  for (let i=0; i < partTypes.length; i++) {
    const img = {
      src: `${partFolder}/${partTypes[i].name}${codeArr[i]}${ext}`,
      offsetX: partTypes[i].offset.x,
      offsetY: partTypes[i].offset.y,
    }
    images.push(img);
  }

  // Generate image
  await mergeImagesToPng(images, outFile);
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


async function generateFaces() {

  // Array that lists all characters
  let characters = [];

  // Save attributes and generate map of attributes to saved array index
  let attrArray = [];
  let attrMap = {};
  let attrFreq = {};
  let attrCount = 0;
  let headWear = 0;
  for (let i=0; i < partTypes.length; i++) {
    for (let j=1; j<=partTypes[i].count; j++) {
      if (partTypes[i].attrNames[j-1].length > 0) {
        attrArray.push(partTypes[i].attrNames[j-1]);
        attrMap[partTypes[i].attrNames[j-1]] = attrCount;
        attrFreq[partTypes[i].attrNames[j-1]] = 0;
        attrCount++;
      }
    }
  }
  let attrjs = `const attributes = ${JSON.stringify(attrArray)};`;
  attrjs += "\n\nmodule.exports.attributes = attributes;";
  fs.writeFileSync(outputAttributesJS, attrjs);

  let imgCount = 1;
  let excludedHeadwear = [1,2,3,4,5,6,7,8,10,18,50];
  // In the loop generate faces and increase the code by one
  let exhausted = false;
  while (!exhausted) {
    // Check if combination is valid
    // let gender = detectGender(codeArr);
    // let valid = checkAttributeCompatibility(codeArr);

    // Skip faces randomly to get close to desired count
    codeArr = []
    for (let i=0; i < partTypes.length; i++) {
      let random = generateRandomNumber(0, partTypes[i].count - 1);
      
      if(i === 5) {
        headWear = getPair(random);
        codeArr.push(random);
      } else if(i === 7) {
        if(headWear === 0) {
          do {
            random = generateRandomNumber(0, partTypes[i].count - 1);
          } while (excludedHeadwear.includes(random));
          codeArr.push(random);
        } else {
          codeArr.push(headWear);
        }
      } else {
        codeArr.push(random);
      }
    }

    const r = (getRandomInt(1000)+1)/1200;
    // const r = 0;
    if ((r <= desiredCount/totalFaces)) {
      // Generate and save current face
      await saveFaceByCode(codeArr, `${outputFolder}/approving-corgi${imgCount}${ext}`);
      let imgPinResult;
      if(uploadToPinata) {
        const result = await pinata.pinFromFS(`${outputFolder}/approving-corgi${imgCount}${ext}`);
        imgPinResult = `https://approvingcorgis.mypinata.cloud/ipfs/${result.IpfsHash}`
      }
      // Add character with accessories
      c = {
        name: `Approving Corgis #${imgCount}`,
        description: "9,999 adorable corgi #NFTs. Don’t worry, they won’t judge or disapprove of you...well, at least most of them won't.", 
        image: imgPinResult,
        attributes: [],
      };

      for (let i=0; i < partTypes.length; i++) {
        if (partTypes[i].attrNames.length != 0)
          if (codeArr[i] !== 0) {
            let attrName = partTypes[i].attrNames[codeArr[i]-1];
            // if (attrName.length > 0) {
              c.attributes.push({trait_type: partTypes[i].name.split('/')[1], value: partTypes[i].attrNames[codeArr[i]]});
              attrFreq[attrName]++;
            // }
          }
      }

      if(uploadToPinata) {
        const options = {
          pinataMetadata: {
            name: `Approving Corgis #${imgCount}`,
          },
        }
        const jsonPinResult = await pinata.pinJSONToIPFS(c, options);
        characters.push(`https://approvingcorgis.mypinata.cloud/ipfs/${jsonPinResult.IpfsHash}`);
      } else {
        characters.push(c);
      }
      imgCount++;
    }

    // Increate code by 1
    
    // if (!canIncrease) exhausted = true;
    if (imgCount == desiredCount + 1) {
      exhausted = true;
    };
  }

  // Save characters' JSON
  fs.writeFileSync(outputCharacterJSON, JSON.stringify(characters));

  console.log("Total generated characters: ", imgCount);
  console.log("Attribute frequencies: ", attrFreq);
}

async function main() {
  await generateFaces();
}

main();

// function test() {
//   code = [1, 6, 2, 4, 4, 1, 8, 1];
//   console.log(detectGender(code));
// }
// test();