const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global.__prismaClient || {};

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prismaClient = { prisma };
}

module.exports = prisma;
