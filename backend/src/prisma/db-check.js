const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const [langs, lvls, lessons, cards, quizzes] = await Promise.all([
    prisma.language.findMany(),
    prisma.level.findMany(),
    prisma.lesson.findMany(),
    prisma.lessonCard.findMany(),
    prisma.quiz.findMany()
  ]);

  console.log("Languages:", langs.map(l => ({ id: l.id, code: l.code, name: l.name })));
  console.log("Levels:", lvls.map(l => ({ id: l.id, code: l.code, name: l.name })));
  console.log("Total Lessons:", lessons.length);
  console.log("Total Cards:", cards.length);
  console.log("Total Quizzes:", quizzes.length);
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
