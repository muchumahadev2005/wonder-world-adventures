const prisma = require("../../prisma/prismaClient");

class AiPromptRepository {
  async getActiveSettings() {
    return prisma.aiPromptSetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async countSettings() {
    return prisma.aiPromptSetting.count();
  }

  async createSettings(data) {
    return prisma.aiPromptSetting.create({
      data,
    });
  }

  async updateSettings(id, data) {
    return prisma.aiPromptSetting.update({
      where: { id },
      data,
    });
  }

  async resetSettings(id, defaultData) {
    if (id) {
      return prisma.aiPromptSetting.update({
        where: { id },
        data: defaultData,
      });
    }
    return prisma.aiPromptSetting.create({
      data: defaultData,
    });
  }
}

module.exports = new AiPromptRepository();
