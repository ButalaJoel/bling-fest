import { query } from "./db.js";

// Ported from vana-power-mart: never throws, so a failed audit write can't break the action.
export async function audit(actor: string, action: string, entity: string, entityId?: string | null,
  details?: Record<string, unknown>, ip?: string | null) {
  try {
    await query(
      "insert into audit_log (actor, action, entity, entity_id, details, ip) values ($1, $2, $3, $4, $5, $6)",
      [actor, action, entity, entityId ?? null, details ? JSON.stringify(details) : null, ip ?? null],
    );
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
}
