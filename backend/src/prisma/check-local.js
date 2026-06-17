const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:mahadev123@localhost:5432/storynest' } } });

async function checkLocalDb() {
  try {
    const tables = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('content_embeddings','chat_conversations','chat_messages')`);
    console.log('Local Tables found:', tables.map(t => t.tablename).join(', '));
    
    try {
      const ext = await prisma.$queryRawUnsafe(`SELECT extname FROM pg_extension WHERE extname='vector'`);
      console.log('pgvector installed:', ext.length > 0);
    } catch(e) {
      console.log('pgvector installed: false');
    }
  } catch (e) {
    console.log('Error checking local DB:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
checkLocalDb();
