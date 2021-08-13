const fs = require("fs");
const mergeImg = require('merge-img');
const partTypes = require('./parts')
// import { partTypes } from "./parts";

const outputFolder = "./generated_corgis";
const outputCharacterJSON = "./outputs/metadata.json";
const outputAttributesJS = "./outputs/attributes.json";

const desiredCount = 20;
const totalFaces = 10000;

const ext = ".png";
const partFolder = "./face_parts";

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const generateRandomNumber = (from, to) => {
  const number = Math.floor(Math.random() * to) + from;
  return number;
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
    if (codeArr[i] != 0) {
      const img = {
        src: `${partFolder}/${partTypes[i].name}${codeArr[i]}${ext}`,
        offsetX: partTypes[i].offset.x,
        offsetY: partTypes[i].offset.y,
      }
      images.push(img);
    }
  }

  // Generate image
  await mergeImagesToPng(images, outFile);
}


async function generateFaces() {

  // Array that lists all characters
  let characters = [];

  // Save attributes and generate map of attributes to saved array index
  let attrArray = [];
  let attrMap = {};
  let attrFreq = {};
  let attrCount = 0;
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

  // "Code array" contains the code of current "face"
  // Initialize it to the first "face"
  let codeArr = [];
  for (let i=0; i < partTypes.length; i++) {
    // codeArr.push(getRandomInt(partTypes[i].count))
    if (partTypes[i].required) {
      const random = generateRandomNumber(1, partTypes[i].count)
      codeArr.push(random);
    } else {
      const random = generateRandomNumber(0, partTypes[i].count)
      codeArr.push(random);
    }
  }
  let imgCount = 0;

  // In the loop generate faces and increase the code by one
  let exhausted = false;
  while (!exhausted) {
    // Check if combination is valid
    // let gender = detectGender(codeArr);
    // let valid = checkAttributeCompatibility(codeArr);

    // Skip faces randomly to get close to desired count
    const r = (getRandomInt(1000)+1)/1200;
    // const r = 0;
    if ((r <= desiredCount/totalFaces)) {
    // if ((r <= desiredCount/totalFaces) && (gender != "Invalid") && (valid)) {
      // Generate and save current face
      await saveFaceByCode(codeArr, `${outputFolder}/approving-corgi${imgCount}${ext}`);

      // Add character with accessories
      c = {
        name: `Approving Corgi #${imgCount}`,
        description: "9,999 adorable corgi #NFTs Sparkles Don’t worry, they won’t judge or disapprove of you...well, at least most of them won't ;)", 
        image: "",
        attributes: [],
      };
      for (let i=0; i < partTypes.length; i++) {
        if (partTypes[i].attrNames.length != 0)
          if (codeArr[i] !== 0 || codeArr[i] !== 1) {
            let attrName = partTypes[i].attrNames[codeArr[i]-1];
            if (attrName.length > 0) {
              c.attributes.push({trait_type: partTypes[i].name.split('/')[1], value: partTypes[i].attrNames[codeArr[i]]});
              attrFreq[attrName]++;
            }
          }
      }
      characters.push(c);

      imgCount++;
    } else {
      // console.log(`Skipping. r = ${r}, gender = ${gender}, codeArr=${codeArr}`);
    }

    // Increate code by 1
    let canIncrease = false;
    codeArr = []
    for (let i=0; i < partTypes.length; i++) {
      if (partTypes[i].required) {
        const random = generateRandomNumber(1, partTypes[i].count)
        codeArr.push(random);
      } else {
        const random = generateRandomNumber(1, partTypes[i].count)
        codeArr.push(random);
      }
      // if (codeArr[i] < partTypes[i].count) {
      //   canIncrease = true;
      //   codeArr[i]++;
      //   for (let j=i-1; j>=0; j--) {
      //     // if (partTypes[j].required)
      //     //   codeArr[j] = 1;
      //     // else
      //     //   codeArr[j] = 0;
      //   }
      //   break;
      // }
    }
    // if (!canIncrease) exhausted = true;
    if (imgCount == desiredCount) {
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