import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // ✅ et plus "driver"
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
