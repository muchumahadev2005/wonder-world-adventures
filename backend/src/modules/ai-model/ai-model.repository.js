const prisma = require("../../prisma/prismaClient");

class AiModelRepository {
  async listModels() {
    return prisma.aiModel.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  async getModelById(id) {
    return prisma.aiModel.findUnique({
      where: { id },
    });
  }

  async getActiveModel() {
    return prisma.aiModel.findFirst({
      where: { isActive: true },
    });
  }

  async countModels() {
    return prisma.aiModel.count();
  }

  async createModel(data) {
    return prisma.aiModel.create({
      data,
    });
  }

  async updateModel(id, data) {
    return prisma.aiModel.update({
      where: { id },
      data,
    });
  }

  async deleteModel(id) {
    return prisma.aiModel.delete({
      where: { id },
    });
  }

  async activateModel(id) {
    return prisma.$transaction([
      prisma.aiModel.updateMany({
        data: { isActive: false },
      }),
      prisma.aiModel.update({
        where: { id },
        data: { isActive: true },
      }),
    ]).then(([, activeModel]) => activeModel);
  }
}

module.exports = new AiModelRepository();
