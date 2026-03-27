export interface GHSData {
  code: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  hazardStatements: string[];
  precautionaryStatements: string[];
  signalWord: string;
}

export const GHS_PICTOGRAMS: Record<string, GHSData> = {
  GHS01: {
    code: "GHS01",
    name: "Explosive",
    shortName: "Explosive",
    icon: "💣",
    description: "Substances and mixtures which are solid, liquid or paste, which are in themselves capable of acting as a fuel and of generating gas when compressed, heated under confinement or subjected to impact.",
    hazardStatements: [
      "H200: Unstable, explosive",
      "H201: Explosive; mass explosion hazard",
      "H202: Explosive; severe projection hazard",
      "H203: Explosive; fire, blast or projection hazard",
      "H204: Fire or projection hazard"
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P234: Keep only in original container",
      "P240: Ground/bond container and receiving equipment",
      "P250: Avoid friction and static electricity",
      "P370+P372: In case of fire: use dry chemical, dry foam, dry powder or water spray for extinction"
    ],
    signalWord: "Danger"
  },
  GHS02: {
    code: "GHS02",
    name: "Flammable",
    shortName: "Flammable",
    icon: "🔥",
    description: "Gases that ignite at room temperature in air at normal pressure, or liquids and solids that readily combust when exposed to sources of ignition.",
    hazardStatements: [
      "H220: Extremely flammable gas",
      "H221: Flammable gas",
      "H222: Extremely flammable aerosol",
      "H223: Flammable aerosol",
      "H224: Extremely flammable liquid and vapor",
      "H225: Highly flammable liquid and vapor",
      "H226: Flammable liquid and vapor"
    ],
    precautionaryStatements: [
      "P210: Keep away from heat, sparks, open flames, hot surfaces",
      "P233: Keep container tightly closed",
      "P235: Keep cool",
      "P370+P378: In case of fire: use dry chemical, dry foam, dry powder or water spray for extinction"
    ],
    signalWord: "Danger/Warning"
  },
  GHS03: {
    code: "GHS03",
    name: "Oxidizing",
    shortName: "Oxidizing",
    icon: "⭕",
    description: "Substances which may, in contact with other material, notably flammable material, cause or contribute to combustion. Includes peroxides, oxidizing gases, and oxidizing liquids/solids.",
    hazardStatements: [
      "H270: May intensify fire; oxidizer",
      "H271: May cause fire or explosion; strong oxidizer",
      "H272: May intensify fire; oxidizer"
    ],
    precautionaryStatements: [
      "P220: Keep away from incompatibles such as reducing agents, organic material, strong bases",
      "P244: Keep valves and fittings free from grease and oil",
      "P280: Wear protective gloves, eye protection, face protection",
      "P370+P376: In case of fire: stop leak if safe to do so"
    ],
    signalWord: "Danger/Warning"
  },
  GHS04: {
    code: "GHS04",
    name: "Compressed Gas",
    shortName: "Gas Under Pressure",
    icon: "🗜️",
    description: "Gases which are contained in a receptacle under pressure, which remain under pressure and include refrigerated/liquefied gases.",
    hazardStatements: [
      "H280: Contains gas under pressure; may explode if heated"
    ],
    precautionaryStatements: [
      "P410+P403: Protect from sunlight. Store in a well-ventilated place",
      "P412: Do not expose to temperatures exceeding 50°C",
      "P442: Heat if necessary to keep in liquid state"
    ],
    signalWord: "Warning"
  },
  GHS05: {
    code: "GHS05",
    name: "Corrosive",
    shortName: "Corrosive",
    icon: "🧪",
    description: "Substances that may cause severe skin burns and serious eye damage. Also includes substances corrosive to metals.",
    hazardStatements: [
      "H314: Causes severe skin burns and eye damage",
      "H318: Causes serious eye damage",
      "H290: May be corrosive to metals"
    ],
    precautionaryStatements: [
      "P280: Wear protective gloves, eye protection, face protection",
      "P301+P330+P331: IF SWALLOWED: rinse mouth. Do NOT induce vomiting",
      "P303+P361+P353: IF ON SKIN (or hair): Rinse immediately with plenty of water",
      "P305+P351+P338: IF IN EYES: Rinse cautiously with water for at least 15 minutes"
    ],
    signalWord: "Danger"
  },
  GHS06: {
    code: "GHS06",
    name: "Acute Toxicity",
    shortName: "Acute Toxicity",
    icon: "☠️",
    description: "Substances or mixtures which can cause death or serious harm if swallowed, inhaled, or absorbed through skin. Includes very toxic and toxic substances.",
    hazardStatements: [
      "H300: Fatal if swallowed",
      "H301: Toxic if swallowed",
      "H310: Fatal in contact with skin",
      "H311: Toxic in contact with skin",
      "H330: Fatal if inhaled",
      "H331: Toxic if inhaled"
    ],
    precautionaryStatements: [
      "P264: Wash thoroughly after handling",
      "P270: Do not eat, drink or smoke when using this product",
      "P271: Use only outdoors or in a well-ventilated area",
      "P301+P310: IF SWALLOWED: immediately call a POISON CENTER"
    ],
    signalWord: "Danger"
  },
  GHS07: {
    code: "GHS07",
    name: "Irritant/Harmful",
    shortName: "Irritant/Harmful",
    icon: "⚠️",
    description: "Substances that cause irritation to skin, eyes, or respiratory system, or mild toxicity hazards from ingestion or inhalation.",
    hazardStatements: [
      "H315: Causes skin irritation",
      "H317: May cause an allergic skin reaction",
      "H319: Causes serious eye irritation",
      "H335: May cause respiratory irritation"
    ],
    precautionaryStatements: [
      "P264: Wash thoroughly after handling",
      "P280: Wear protective gloves, eye protection, face protection",
      "P302+P352: IF ON SKIN: wash with plenty of water",
      "P305+P351+P338: IF IN EYES: rinse cautiously with water for at least 15 minutes"
    ],
    signalWord: "Warning"
  },
  GHS08: {
    code: "GHS08",
    name: "Health Hazard",
    shortName: "Health Hazard",
    icon: "⚕️",
    description: "Substances that may cause serious health effects including carcinogenicity, respiratory sensitization, mutations, organ toxicity, and hazards to the ozone layer.",
    hazardStatements: [
      "H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled",
      "H340: May cause genetic defects (suspected)",
      "H341: Suspected of causing genetic defects",
      "H350: May cause cancer",
      "H351: Suspected of causing cancer",
      "H360: May damage fertility or the unborn child",
      "H361: Suspected of damaging fertility or the unborn child",
      "H362: May cause harm to breast-fed children",
      "H372: Causes damage to organs through prolonged or repeated exposure",
      "H373: May cause damage to organs through prolonged or repeated exposure"
    ],
    precautionaryStatements: [
      "P260: Do not breathe dust/fume/gas/mist/vapors",
      "P264: Wash thoroughly after handling",
      "P270: Do not eat, drink or smoke when using this product",
      "P271: Use only outdoors or in a well-ventilated area"
    ],
    signalWord: "Danger/Warning"
  },
  GHS09: {
    code: "GHS09",
    name: "Environmental Hazard",
    shortName: "Environmental Hazard",
    icon: "🐟",
    description: "Substances or mixtures that are acutely or chronically toxic to aquatic life, or may damage the ozone layer.",
    hazardStatements: [
      "H400: Very toxic to aquatic life",
      "H401: Toxic to aquatic life",
      "H402: Harmful to aquatic life",
      "H410: Very toxic to aquatic life with long-lasting effects",
      "H411: Toxic to aquatic life with long-lasting effects",
      "H412: Harmful to aquatic life with long-lasting effects",
      "H413: May cause long-lasting harmful effects to aquatic life"
    ],
    precautionaryStatements: [
      "P273: Avoid release to the environment",
      "P391: Collect spillage",
      "P501: Dispose of contents/container in accordance with local regulations"
    ],
    signalWord: "Warning"
  }
};

// Helper function to get GHS pictogram info
export const getGHSInfo = (code: string): GHSData | undefined => {
  return GHS_PICTOGRAMS[code];
};

// Helper function to format tooltip content
export const formatGHSTooltip = (ghsData: GHSData): string => {
  //const hazards = ghsData.hazardStatements.slice(0, 3).join('\n');
  //const precautions = ghsData.precautionaryStatements.slice(0, 2).join('\n');
  
  return `${ghsData.name}\n\n${ghsData.description}\n\nSignal Word: ${ghsData.signalWord}\n`;
  //return `${ghsData.name}\n\n${ghsData.description}\n\nSignal Word: ${ghsData.signalWord}\n\nKey Hazard Statements:\n${hazards}\n\nKey Precautionary Statements:\n${precautions}`;
};

