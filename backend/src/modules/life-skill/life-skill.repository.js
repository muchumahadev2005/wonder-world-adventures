const prisma = require("../../prisma/prismaClient");

class LifeSkillRepository {
  async listAll() {
    return prisma.lifeSkillScenario.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  async listActive() {
    return prisma.lifeSkillScenario.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findBySlug(slug) {
    return prisma.lifeSkillScenario.findUnique({ where: { slug } });
  }

  async findById(id) {
    return prisma.lifeSkillScenario.findUnique({ where: { id } });
  }

  async count() {
    return prisma.lifeSkillScenario.count();
  }

  async create(data) {
    return prisma.lifeSkillScenario.create({ data });
  }

  async update(id, data) {
    return prisma.lifeSkillScenario.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.lifeSkillScenario.delete({ where: { id } });
  }
}

module.exports = new LifeSkillRepository();
