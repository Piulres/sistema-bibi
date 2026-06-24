export type { TimelineEventMetadata } from "@/lib/change-management/types";
export {
  CHANGE_FIELD_LABELS,
  buildChangeMetadata,
  buildDeleteMetadata,
  changeFieldLabel,
  formatMetadataValue,
  metadataHasDiff,
  parseTimelineMetadata,
  serializeTimelineMetadata,
} from "@/lib/change-management/metadata";
