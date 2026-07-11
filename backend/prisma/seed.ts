// prisma/seed.ts
// Seeds 1 default admin. Email/password pulled from env, with safe defaults.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL atau DATABASE_URL wajib diisi untuk seed");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@samantha.local";
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
const DEFAULT_NAME = process.env.SEED_ADMIN_NAME ?? "Admin";

async function main() {
  const existing = await prisma.admin.findUnique({
    where: { email: DEFAULT_EMAIL },
  });
  if (existing) {
    console.log(`[seed] admin '${DEFAULT_EMAIL}' already exists, skip.`);
    return;
  }
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const admin = await prisma.admin.create({
    data: {
      email: DEFAULT_EMAIL,
      passwordHash,
      name: DEFAULT_NAME,
    },
  });
  console.log(`[seed] created admin id=${admin.id} email=${admin.email}`);
  console.log(`[seed] default password (CHANGE ME): ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("[seed] error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
