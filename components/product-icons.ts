import type { CategoryId } from "@/lib/catalog-types";
import type { IconName } from "@/components/icons";

const BY_ID: Record<string, IconName> = {
  oak: "HoneyJar", lemon: "Drop", eucalyptus: "Leaf", jardi: "Honeycomb",
  baraka: "Drop", "sidr-egy": "HoneyJar", "sidr-kashmir": "HoneyJar",
  clover: "Leaf", thyme: "Leaf", comb: "Honeycomb",
  pollen: "Sparkle", "royal-jelly": "Drop", ginseng: "Leaf",
  "propolis-local": "Shield", "propolis-import": "Shield", "palm-pollen": "Sparkle",
  "foundation-wax": "Honeycomb", "drawn-wax": "Honeycomb", hives: "Hive",
  frames: "Hive", supers: "Hive", barrels: "HoneyJar", "pollen-traps": "Sparkle",
  extractors: "Drop", suits: "Shield", candy: "Drop", bees: "Bee",
};

const BY_CATEGORY: Record<CategoryId, IconName> = {
  honey: "HoneyJar",
  health: "Sparkle",
  equipment: "Hive",
};

/** Icon shown while a product has no photo. */
export function productIcon(id: string, category: CategoryId): IconName {
  return BY_ID[id] ?? BY_CATEGORY[category];
}
