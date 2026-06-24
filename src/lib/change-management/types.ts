/** Metadados de alteração gravados em TimelineEvent.metadata (JSON). */

export type TimelineEventMetadata = {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  fieldsChanged?: string[];
};
