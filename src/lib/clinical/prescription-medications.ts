/** Medicamentos frequentes para autocomplete (por tenant — extensível). */
export const COMMON_MEDICATIONS = [
  { name: "Dipirona 500mg", dosage: "1 comprimido", frequency: "6/6h se dor ou febre" },
  { name: "Omeprazol 20mg", dosage: "1 cápsula", frequency: "1x ao dia em jejum" },
  { name: "Losartana 50mg", dosage: "1 comprimido", frequency: "1x ao dia" },
  { name: "Metformina 850mg", dosage: "1 comprimido", frequency: "2x ao dia após refeições" },
  { name: "Amoxicilina 500mg", dosage: "1 cápsula", frequency: "8/8h por 7 dias" },
  {
    name: "Polietilenoglicol (PEG)",
    dosage: "1 sachê",
    frequency: "Diluir conforme bula — preparo intestinal",
  },
  { name: "Buscopan 10mg", dosage: "1 comprimido", frequency: "8/8h se cólica" },
] as const;
