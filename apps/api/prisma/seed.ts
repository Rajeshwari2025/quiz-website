import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const facultyPassword = await bcrypt.hash("FacultyPass123", 12);

  const faculty = await prisma.user.upsert({
    where: { email: "faculty@example.com" },
    update: {},
    create: {
      email: "faculty@example.com",
      passwordHash: facultyPassword,
      firstName: "Demo",
      lastName: "Faculty",
      role: "FACULTY",
    },
  });

  const inviteToken = crypto.randomBytes(48).toString("hex");

  await prisma.facultyInvite.create({
    data: {
      email: "newfaculty@example.com",
      token: inviteToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      createdById: faculty.id,
    },
  });

  console.log("Seeded faculty@example.com / FacultyPass123");
  console.log("Faculty invite token for newfaculty@example.com:", inviteToken);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
