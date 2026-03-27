const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('src/data/sdsRecords.json', 'utf8'));

// Standard sections template
const standardSections = {
  section2: {
    classification: "Skin irritation, Category 2; Skin sensitisation, Category 1",
    hazards: ["Skin irritation", "Skin sensitisation"],
    ghsCodes: ["H315", "H317"],
    signalWord: "Warning",
    hazardStatements: "H315: Causes skin irritation. H317: May cause an allergic skin reaction.",
    precautionaryCodes: ["P261", "P280", "P302+P352", "P333+P313", "P501"],
    precautionaryStatements: "P261: Avoid breathing mist or vapours. P280: Wear protective gloves. P302+P352: IF ON SKIN: Wash with plenty of soap and water. P333+P313: If skin irritation or rash occurs: Get medical advice/attention. P501: Dispose of contents/container to an approved waste disposal plant.",
    carcinogenicity: "No component of this product present at levels greater than or equal to 0.1% is identified as probable, possible or confirmed human carcinogen by IARC, OSHA, or NTP."
  },
  section3: {
    chemicalNature: "Fragrance for consumer product",
    description: "Fragrance Compound: A multi component mixture of fragrance ingredients. The specific chemical identities of the ingredients not listed herein are considered by IFF to be Trade Secrets and are withheld in accordance with the provisions of 1910.1200 of Title29 of the U.S. Code of Federal Regulations.",
    composition: []
  },
  section9: {
    physicalState: "liquid",
    appearance: "CLEAR LIQUID",
    odour: "conforms to standard",
    flashPoint: "246 °F (119 °C)",
    vapourPressure: ".03 hPa (0.03 hPa) at 68 °F (20 °C)",
    note: "Calculated"
  },
  section14: {
    dot: "Not dangerous goods",
    iata: {
      unNumber: "UN3082",
      description: "ENVIRONMENTALLY HAZARDOUS SUBSTANCE, LIQUID, N.O.S. (Octahydro Tetramethyl Naphthalenyl Ethanone)",
      class: "9",
      packingGroup: "III",
      labels: "9"
    },
    imdg: {
      unNumber: "UN3082",
      description: "ENVIRONMENTALLY HAZARDOUS SUBSTANCE, LIQUID, N.O.S. (Octahydro Tetramethyl Naphthalenyl Ethanone)",
      class: "9",
      packingGroup: "III",
      labels: "9",
      emsNumber1: "F-A",
      emsNumber2: "S-F",
      marinePollutant: "yes"
    },
    otherInformation: "Shipment by ground under DOT is non-regulated; however it may be shipped per the applicable hazard classification to facilitate multi-modal transport involving ICAO (IATA) or IMO."
  }
};

// Update all records
data.forEach(record => {
  record.sections = standardSections;
});

// Write back to file
fs.writeFileSync('src/data/sdsRecords.json', JSON.stringify(data, null, 2), 'utf8');

console.log('All sections updated successfully!');

