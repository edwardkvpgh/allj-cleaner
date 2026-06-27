export type ThemeGroup = "dark" | "light";

export type ThemeId =
  | "neon"
  | "vintage-mood"
  | "cosmic-artistry"
  | "corporate-traditional"
  | "clean-modern"
  | "vibrant-elegant"
  | "warm-ember"
  | "terminal-alert"
  | "metallic-chic"
  | "earthy-serene"
  | "vibrant-calm"
  | "lively-inviting"
  | "artsy-creative"
  | "minimal-warm"
  | "clean-energetic"
  | "agency-gold";

export interface ThemeOption {
  id: ThemeId;
  label: string;
  group: ThemeGroup;
  description: string;
  tag: string;
}

export const DEFAULT_THEME_ID: ThemeId = "neon";

export const THEME_STORAGE_KEY = "detox-theme";

export const THEMES: ThemeOption[] = [
  {
    id: "neon",
    label: "Detox Original",
    group: "dark",
    tag: "Default",
    description: "The signature Detox look — neon purple, cyan, and pink on deep void.",
  },
  {
    id: "vintage-mood",
    label: "Deep Vintage Mood",
    group: "dark",
    tag: "Cinematic",
    description: "Earthy terracotta and deep teal — vintage cinematic warmth.",
  },
  {
    id: "cosmic-artistry",
    label: "Cosmic Artistry",
    group: "dark",
    tag: "Cosmic",
    description: "Space teal and silver mist on charcoal navy — gallery-premium dark.",
  },
  {
    id: "corporate-traditional",
    label: "Corporate Traditional",
    group: "dark",
    tag: "Corporate",
    description: "Deep charcoal teal with luminous seafoam glows — polished, trustworthy corporate dark.",
  },
  {
    id: "clean-modern",
    label: "Clean and Modern",
    group: "dark",
    tag: "Modern",
    description: "Neutral charcoal canvas with crisp mint-white type and vivid green-teal accents — contemporary Serio Verify energy.",
  },
  {
    id: "vibrant-elegant",
    label: "Vibrant and Elegant",
    group: "dark",
    tag: "Elegant",
    description: "Deep studio navy with coral glows, sky-blue highlights, and pale gold type — bold Waaark elegance.",
  },
  {
    id: "warm-ember",
    label: "Warm Ember",
    group: "dark",
    tag: "Premium",
    description: "Warm charcoal with vivid orange accents — focused premium dark mode.",
  },
  {
    id: "terminal-alert",
    label: "Terminal Alert",
    group: "dark",
    tag: "Cyber",
    description: "True black with acid yellow highlights — high-contrast security terminal.",
  },
  {
    id: "metallic-chic",
    label: "Metallic Chic",
    group: "light",
    tag: "Metallic",
    description: "Lavender mist canvas with cool blue and periwinkle metallic tones.",
  },
  {
    id: "earthy-serene",
    label: "Earthy and Serene",
    group: "light",
    tag: "Natural",
    description: "Warm sand and taupe — calm, architectural natural light.",
  },
  {
    id: "vibrant-calm",
    label: "Vibrant but Calm",
    group: "light",
    tag: "Editorial",
    description: "Soft cream base with bold coral, rose, and golden accents.",
  },
  {
    id: "lively-inviting",
    label: "Lively and Inviting",
    group: "light",
    tag: "Fresh",
    description: "Greige canvas with coral highlights and fresh lime green pops.",
  },
  {
    id: "artsy-creative",
    label: "Artsy and Creative",
    group: "light",
    tag: "Creative",
    description: "Warm cream with royal blue, mustard gold, and vibrant red accents.",
  },
  {
    id: "minimal-warm",
    label: "Minimal Yet Warm",
    group: "light",
    tag: "Minimal",
    description: "Refined cream and sand with soft terracotta coral accents.",
  },
  {
    id: "clean-energetic",
    label: "Clean and Energetic",
    group: "light",
    tag: "Digital",
    description: "Lavender canvas with royal blue and amethyst purple energy.",
  },
  {
    id: "agency-gold",
    label: "Agency Gold",
    group: "light",
    tag: "Studio",
    description: "Mustard canvas with cream surfaces, golden yellow, and bold black accents.",
  },
];

const THEME_IDS = new Set<string>(THEMES.map((theme) => theme.id));

const LIGHT_THEME_IDS = new Set<string>(
  THEMES.filter((theme) => theme.group === "light").map((theme) => theme.id),
);

/** Retired built-in themes fall back to Detox Original. */
const LEGACY_THEME_IDS: Record<string, ThemeId> = {
  midnight: "neon",
  dracula: "neon",
  catppuccin: "neon",
  "tokyo-night": "neon",
  nord: "neon",
  "one-dark": "neon",
  daylight: "metallic-chic",
  "github-light": "metallic-chic",
  paper: "earthy-serene",
  "solarized-light": "minimal-warm",
};

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value != null && THEME_IDS.has(value);
}

function resolveThemeId(value: string | null): ThemeId {
  if (value != null && isThemeId(value)) {
    return value;
  }
  if (value != null && value in LEGACY_THEME_IDS) {
    return LEGACY_THEME_IDS[value];
  }
  return DEFAULT_THEME_ID;
}

export function getThemeOption(id: ThemeId): ThemeOption {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function isLightThemeId(id: ThemeId): boolean {
  return LIGHT_THEME_IDS.has(id);
}

export function readStoredThemeId(): ThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_ID;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const resolved = resolveThemeId(stored);
    if (stored != null && stored !== resolved) {
      persistThemeId(resolved);
    }
    return resolved;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function applyThemeId(id: ThemeId): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = id;
  document.documentElement.dataset.themeBrightness =
    getThemeOption(id).group === "light" ? "light" : "dark";
  document.documentElement.style.colorScheme =
    getThemeOption(id).group === "light" ? "light" : "dark";
}

export function persistThemeId(id: ThemeId): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // ignore quota / private mode
  }
}

export const THEME_SWATCH_COLORS: Record<ThemeId, readonly [string, string, string, string]> = {
  neon: ["#a855f7", "#22d3ee", "#12121f", "#ff2d95"],
  "vintage-mood": ["#E64833", "#90AEAD", "#244855", "#874F41"],
  "cosmic-artistry": ["#124E66", "#748D92", "#212A31", "#D3D9D4"],
  /* Corporate: luminous seafoam → aqua → warm sand → blue-charcoal void */
  "corporate-traditional": ["#B4F0EE", "#78DCD8", "#0E262A", "#C4B5A0"],
  /* Clean Modern: vivid green-teal → mint white → forest → neutral charcoal */
  "clean-modern": ["#3AAFA9", "#DEF2F1", "#17252A", "#2B7A78"],
  /* Vibrant Elegant: deep coral → steel blue → navy void → amber gold */
  "vibrant-elegant": ["#D2645C", "#348AC6", "#161E3C", "#D2A848"],
  "warm-ember": ["#F97316", "#EA580C", "#1A1614", "#22C55E"],
  "terminal-alert": ["#E8FF00", "#C8E600", "#0A0A0A", "#FFFFFF"],
  "metallic-chic": ["#7091E6", "#3D52A0", "#EDE8F5", "#8697C4"],
  "earthy-serene": ["#865D36", "#AC8968", "#e8dfd4", "#93785B"],
  "vibrant-calm": ["#E43D12", "#D6536D", "#EBE9E1", "#EFB11D"],
  "lively-inviting": ["#E7717D", "#AFD275", "#C2CAD0", "#C2B9B0"],
  "artsy-creative": ["#4056A1", "#F13C20", "#EFE2BA", "#D79922"],
  "minimal-warm": ["#E85A4F", "#E98074", "#EAE7DC", "#D8C3A5"],
  "clean-energetic": ["#8860D0", "#5680E9", "#C1C8E4", "#84CEEB"],
  "agency-gold": ["#DCA520", "#C36E32", "#F0ECE4", "#1C1917"],
};
