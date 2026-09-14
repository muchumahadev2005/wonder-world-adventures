require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

p.storyWeaverAudio
	.findFirst({ select: { title: true, coverImage: true, pages: true } })
	.then((r) => {
		console.log("\n--- TITLE ---");
		console.log(r.title);
		console.log("\n--- COVER IMAGE (what's stored) ---");
		console.log(r.coverImage);
		console.log("\n--- FIRST 2 PAGES (what's stored) ---");
		console.log(JSON.stringify(r.pages.slice(0, 2), null, 2));
	})
	.finally(() => p.$disconnect());
