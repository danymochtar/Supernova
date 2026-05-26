/**
 * Read the curhat `topic` tag out of a QaHistory.contextSnapshot JSON value.
 * Snapshots written before the tagging feature have no `topic` key → null.
 */
export function topicFromSnapshot(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const topic = (snapshot as { topic?: unknown }).topic;
  return typeof topic === 'string' ? topic : null;
}
