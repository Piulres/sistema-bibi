export const PET_SPECIES = ["CANINO", "FELINO", "AVES", "OUTRO"] as const;
export const PET_SEX = ["M", "F", "NI"] as const;
export const PET_SIZES = ["PEQUENO", "MEDIO", "GRANDE"] as const;
export const PET_STATUSES = ["ATIVO", "FALECIDO", "TRANSFERIDO"] as const;

export type PetSpecies = (typeof PET_SPECIES)[number];
export type PetSex = (typeof PET_SEX)[number];
export type PetSize = (typeof PET_SIZES)[number];
export type PetStatus = (typeof PET_STATUSES)[number];

export const PET_SPECIES_LABELS: Record<PetSpecies, string> = {
  CANINO: "Canino",
  FELINO: "Felino",
  AVES: "Aves",
  OUTRO: "Outro",
};

export const PET_SIZE_LABELS: Record<PetSize, string> = {
  PEQUENO: "Pequeno porte",
  MEDIO: "Médio porte",
  GRANDE: "Grande porte",
};

export function isPetSpecies(value: string): value is PetSpecies {
  return (PET_SPECIES as readonly string[]).includes(value);
}

export function isPetSex(value: string): value is PetSex {
  return (PET_SEX as readonly string[]).includes(value);
}

export function isPetSize(value: string): value is PetSize {
  return (PET_SIZES as readonly string[]).includes(value);
}

export function isPetStatus(value: string): value is PetStatus {
  return (PET_STATUSES as readonly string[]).includes(value);
}
