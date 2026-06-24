import type { NicheId } from "@/lib/niche/types";
import { SEGMENT_COLORS, type SegmentColorPreset } from "@/lib/theme/segment-colors";

/** Presets de cor por nicho — reexporta `SEGMENT_COLORS` (fonte canônica). */
export const NICHE_PRESETS_ENERGIA_BRASILEIRA: Record<NicheId, SegmentColorPreset> =
  SEGMENT_COLORS;
