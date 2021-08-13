const fs = require("fs");
const mergeImg = require('merge-img');

const outputFolder = "./generated_faces";
const outputCharacterJSON = "./generated_faces/characters.json";
const outputAttributesJS = "./generated_faces/attributes.json";

const desiredCount = 20;
const totalFaces = 9999;

const ext = ".png";
const partFolder = "./face_parts";

const partTypes = [
  {
    name: 'background/background',
    count: 11,
    offset: {x: 0, y: 0},
    attrNames:['Cyan','Peach','Yellow','Green','Blue','Violet','Pink','Purple','Caramel','Grey','Beige'],
    required: true,
  },
  {
    name: 'fur/fur',
    count: 8,
    offset: {x:  -1080, y: 0},
    attrNames:['Fawn','Orange','Red','Snow White','Pink','Chocolate','Maroon','Grey'],
    required: true,
  },
  {
    name: 'face/face',
    count: 6,
    offset: {x: -1080, y: 0},
    attrNames:['Smiling','Happy','Crazy','Disapproving','Thick Eyebrows','Cigarette'],
    required: true,
  },
  {
    name: 'nose/nose',
    count: 5,
    offset: {x: -1080, y: 0},
    attrNames:['black','dark brown','light brown','flesh','pink'],
    required: true,
  },
  {
    name: 'outfit/outfit',
    count: 65,
    offset: {x: -1080, y: 0},
    attrNames:['','Baseball 1','Baseball 2','Football Jersey 1','Football Jersey 2','Graduation Gown','Chef','Pirate Red','Pirate Blue',
    'Bandana Red','Bandana Purple','Taekwondo','King Crown Black','King Crown Red','Equestrian','Soldier','Basketball 1','Basketball 2',
    'Hockey 1','Hockey 2','School Uniform','Polkadots 1','Polkadots 2','Stripe Longsleeves 1','Stripe Longsleeves 2','Scarf Black',
    'Scarf Maroon','Paw Print Pink','Paw Print Yellow','Sweater Red','Sweater Purple','Jumper Blue','Jumper Purple','Cross Stitch 1',
    'Cross Stitch 2','Mummy','Hoody 1','Hoody 2','Bow Tie Blue','Bow Tie Red','Life Vest','Gold Collar','Padded Armor Green','Padded Armor Brown',
    'V-neck + Bone Print 1','V-neck + Bone Print 2','Padded Vest 1','Padded Vest 2','Polkadot Tie 1','Polkadot Tie 2','Striped Tie 1','Striped Tie 2',
    'Spiked Collar','Xray Shirt','Tshirt + Rainbow 1','Tshirt + Rainbow 2','Tshirt + Etherium 1','Tshirt + Etherium 2','Tshirt Camouflag + Dog Tag Silver 1',
    'Tshirt Camouflag + Dog Tag Silver 2','Stripe tshirt + Dog Tag Black 1','Stripe tshirt + Dog Tag Black 2','Fang Necklace','Rainbow Suspender Bowtie'],
    required: false,
  },
  {
    name: 'eyewear/eyewear',
    count: 4,
    offset: {x: -1080, y: 0},
    attrNames:['','Goggles 1','Goggles 2','Eye Patch'],
    required: false,
  },
  {
    name: 'headwear/headwear',
    count: 9,
    offset: {x: -1080, y: 0},
    attrNames:['','Graduation Cap','Chef Hat','Pirate Hat 1','Pirate Hat 2','Bandana 1','Bandana 2','Taekwondo','Demon'],
    required: false,
  },
  {
    name: 'earaccessory/earaccessory',
    count: 4,
    offset: {x: -1080, y: 0},
    attrNames:['','Hoop Gold Piercing','Stud Silver Piercing','Double Stud Silver Piercing'],
    required: false,
  },
]

// function checkAttributeCompatibility(codeArr) {

//   let blondeHair = false;
//   let earring = false;
//   for (let i=0; i<partTypes.length; i++) {
//     if ((partTypes[i].name == "hair/hair") && (codeArr[i] == 10))
//       blondeHair = true;
//     if ((partTypes[i].name == "ears/ears") && (codeArr[i] >= 2))
//       earring = true;
//   }

//   if (earring && blondeHair) return false;
//   return true;
// }

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const generateRandomNumber = (from, to) => {
  const number = Math.floor(Math.random() * to) + from;
  return number;
}

// function detectGender(codeArr) {
//   let male = false;
//   let female = false;
//   for (let i=0; i < partTypes.length; i++) {
//     if (codeArr[i] != 0) {
//       const attrGender = partTypes[i].attrSex[codeArr[i]-1];
//       if (attrGender == "m") male = true;
//       if (attrGender == "f") female = true;
//     }
//   }

//   if (male && female) return "Invalid";
//   if (male) return "Male";
//   if (female) return "Female";

//   if (getRandomInt(100) > 50) return "Female";
//   else return "Male";
// }

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
    if (partTypes[i].required) {
      const random = generateRandomNumber(1, partTypes[i].count)
      codeArr.push(random);
    } else { 
      const randomo2 = generateRandomNumber(0, partTypes[i].count)
      codeArr.push(randomo2);
    }
  }
  console.log("🚀 ~ file: generate-corgis.js ~ line 196 ~ generateFaces ~ codeArr", codeArr)
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
        id: imgCount,
        // gender: gender,
        attributes: []
      };
      for (let i=0; i < partTypes.length; i++) {
        if (partTypes[i].attrNames.length != 0)
          if (codeArr[i] != 0) {
            let attrName = partTypes[i].attrNames[codeArr[i]-1];
            if (attrName.length > 0) {
              c.attributes.push(attrMap[attrName]);
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
    for (let i=0; i < partTypes.length; i++) {
      if (codeArr[i] < partTypes[i].count) {
        canIncrease = true;
        codeArr[i]++;
        for (let j=i-1; j>=0; j--) {
          if (partTypes[j].required)
            codeArr[j] = 1;
          else
            codeArr[j] = 0;
        }
        break;
      }
    }
    if (!canIncrease) exhausted = true;
    if (imgCount == desiredCount) break;
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