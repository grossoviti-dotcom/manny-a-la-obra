import "server-only";
import { cookies } from "next/headers";

export async function getAnonId() {
  return (await cookies()).get("manny_anon")?.value ?? null;
}
