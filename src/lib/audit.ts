import { db, schema, type Tx } from "@/db";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  meta?: Record<string, unknown>,
  tx?: Tx,
) {
  await (tx ?? db).insert(schema.auditLog).values({ actorId, action, entity, entityId, meta });
}
