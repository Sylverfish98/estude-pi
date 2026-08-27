import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

process.loadEnvFile?.(".env");
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });

function utcToday() {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

async function main() {
  const passwordHash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: { username: "demo", passwordHash },
  });

  // Clean prior demo content for idempotency.
  await prisma.subject.deleteMany({ where: { userId: user.id } });

  const bio = await prisma.subject.create({
    data: { name: "Biologia", color: "#6FBE3F", order: 0, userId: user.id },
  });
  const mat = await prisma.subject.create({
    data: { name: "Matemática", color: "#C9A227", order: 1, userId: user.id },
  });

  const reino = await prisma.topic.create({
    data: { name: "Reino Animal", order: 0, subjectId: bio.id },
  });
  const alg = await prisma.topic.create({
    data: { name: "Álgebra", order: 0, subjectId: mat.id },
  });

  const today = utcToday();
  await prisma.agendamento.createMany({
    data: [
      {
        name: "Invertebrados",
        order: 0,
        dayOrder: 0,
        topicId: reino.id,
        date: today,
        link: "https://pt.wikipedia.org/wiki/Invertebrados",
      },
      { name: "Vertebrados", order: 1, topicId: reino.id },
      { name: "Alimentação", order: 2, dayOrder: 2, topicId: reino.id, date: today },
      { name: "Logaritmos", order: 0, dayOrder: 1, topicId: alg.id, date: today },
    ],
  });

  console.log("Seeded user 'demo' / 'demo123' with example subjects.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
