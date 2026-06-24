/** Re-exports server-only — importar apenas em API routes e services. */
export {
  ENTITY_REVERSIBILITY,
  getRestoreWindowMs,
  restoreRequiresConfirmPhrase,
} from "@/lib/change-management/policy";
export { createEntityRevision, getNextRevision, listEntityRevisions } from "@/lib/change-management/revisions";
export { RestoreError, restoreFromTimelineEvent, revertRecentChange } from "@/lib/change-management/restore";
export { newCorrelationId, runChangeCommand } from "@/lib/change-management/run-change";
export * from "@/lib/change-management/snapshots";
