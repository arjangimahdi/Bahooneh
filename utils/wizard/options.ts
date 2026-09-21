export const AGE_RANGES = ["kid", "teen", "20s", "30s", "40s", "50plus"] as const;
export const GENDERS = ["male", "female", "unspecified"] as const;
export const RELATIONSHIPS = ["partner", "parent", "sibling", "friend", "colleague", "boss", "inLaw"] as const;
export const OCCASIONS = [
    "birthday",
    "anniversary",
    "wedding",
    "apology",
    "graduation",
    "housewarming",
    "justBecause",
    "corporate",
    "nowruz",
    "yalda",
] as const;
export const VIBES = ["romantic", "playful", "formal", "practical", "luxurious", "sentimental"] as const;
export const INTERESTS = [
    "tech",
    "reading",
    "outdoor",
    "fashion",
    "homeCooking",
    "gaming",
    "fitness",
    "art",
    "music",
    "travel",
] as const;
export const DISLIKES = ["noClothes", "noPerfume", "noGag", "noFood"] as const;
export const ALLERGIES = ["nuts", "fragrance", "latex"] as const;
export const OWNS = [
    "ps5",
    "switch",
    "xbox",
    "gamingHeadset",
    "airpods",
    "smartwatch",
    "powerbank",
    "ereader",
    "yogaMat",
    "smartBand",
    "headphones",
    "speaker",
    "airfryer",
    "coffeeMaker",
    "backpack",
    "tent",
    "drawingTablet",
] as const;

export const OWNS_BY_INTEREST: Record<(typeof INTERESTS)[number], readonly (typeof OWNS)[number][]> = {
    gaming: ["ps5", "switch", "xbox", "gamingHeadset"],
    tech: ["airpods", "smartwatch", "powerbank"],
    reading: ["ereader"],
    fitness: ["yogaMat", "smartBand"],
    music: ["headphones", "speaker"],
    homeCooking: ["airfryer", "coffeeMaker"],
    travel: ["backpack"],
    outdoor: ["tent"],
    art: ["drawingTablet"],
    fashion: [],
};

export const BUDGET_FLOOR = 50_000;
export const BUDGET_CEILING = 30_000_000;
export const FREE_TEXT_MIN = 5;
export const FREE_TEXT_MAX = 500;

export const BUDGET_PRESETS = [
    { id: "under500k", min: BUDGET_FLOOR, max: 500_000 },
    { id: "500kTo1m", min: 500_000, max: 1_000_000 },
    { id: "1mTo3m", min: 1_000_000, max: 3_000_000 },
    { id: "over3m", min: 3_000_000, max: BUDGET_CEILING },
] as const;

export const WIZARD_STEPS = ["target", "occasion", "interests", "antiPrefs", "budget"] as const;
