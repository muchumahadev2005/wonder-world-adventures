// Load environment overrides (.env.development) first
require('./src/config/env');
const prisma = require('./src/prisma/prismaClient');
const { listStoriesSchema } = require('./src/modules/stories/validators/stories.validation');

async function test(query) {
  const parsed = listStoriesSchema.parse(query);
  const where = {};

  if (typeof parsed.isPublished === "boolean") {
    where.isPublished = parsed.isPublished;
  }
  // Let's mimic stories.repository.js list logic:
  if (parsed.category)   where.category  = { equals: parsed.category,  mode: "insensitive" };
  if (parsed.ageGroup)   where.ageGroup   = parsed.ageGroup;
  if (parsed.difficulty) where.difficulty = { equals: parsed.difficulty, mode: "insensitive" };

  if (typeof parsed.isPremium     === "boolean") where.isPremium     = parsed.isPremium;
  if (typeof parsed.isFeatured    === "boolean") where.isFeatured    = parsed.isFeatured;
  if (typeof parsed.isTrending    === "boolean") where.isTrending    = parsed.isTrending;
  if (typeof parsed.isRecommended === "boolean") where.isRecommended = parsed.isRecommended;

  if (parsed.search) {
    where.OR = [
      { title:       { contains: parsed.search, mode: "insensitive" } },
      { author:      { contains: parsed.search, mode: "insensitive" } },
      { description: { contains: parsed.search, mode: "insensitive" } },
    ];
  }

  // Language filter builder
  const language = parsed.language || parsed.languageId;
  if (language) {
    Object.assign(where, {
      OR: [
        { languageId: language },
        { language: { code: { equals: language, mode: "insensitive" } } },
        { language: { name: { equals: language, mode: "insensitive" } } },
      ],
    });
  }

  console.log('Generated where clause:', JSON.stringify(where, null, 2));

  const stories = await prisma.story.findMany({
    where,
    include: { language: true }
  });

  console.log('Stories count in database with this where:', stories.length);
  stories.forEach(s => {
    console.log(`- Title: "${s.title}" | Language: ${s.language?.code || 'None'} | Published: ${s.isPublished}`);
  });
}

test({ limit: 200 }).then(() => prisma.$disconnect());
