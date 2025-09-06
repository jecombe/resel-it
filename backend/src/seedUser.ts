import { db } from "./db";
import { users } from "./db/schema";

export async function seedUser() {
  try {
    const user = await db.insert(users).values({
      address: "0x0000000000000000000000000000000000000000",
      // createdAt sera automatiquement défini
    }).returning();

    console.log("✅ User inserted:", user);
  } catch (error) {
    console.error("❌ Failed to insert user:", error);
  }
}

