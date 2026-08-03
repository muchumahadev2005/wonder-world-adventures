const prisma = require("../../../prisma/prismaClient");

const autoExpireSubscriptions = async () => {
  try {
    await prisma.userSubscription.updateMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: new Date() },
      },
      data: {
        status: "EXPIRED",
      },
    });
  } catch (err) {
    // silent catch
  }
};

const listPlans = () => {
  return prisma.subscriptionPlan.findMany({ where: { isActive: true } });
};

const getPlanById = (planId) => {
  return prisma.subscriptionPlan.findUnique({ where: { id: planId } });
};

const getActiveSubscriptionByUserId = async (userId) => {
  await autoExpireSubscriptions();
  return prisma.userSubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
    include: { plan: true, features: true },
  });
};

const getLatestSubscriptionByUserId = async (userId) => {
  await autoExpireSubscriptions();
  return prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { plan: true, features: true },
  });
};

const createSubscription = ({ userId, planId, startDate, endDate }) => {
  return prisma.userSubscription.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      startDate,
      endDate,
    },
    include: { plan: true, features: true },
  });
};

const cancelSubscription = ({ userId }) => {
  return prisma.userSubscription.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });
};

module.exports = {
  autoExpireSubscriptions,
  listPlans,
  getPlanById,
  getActiveSubscriptionByUserId,
  getLatestSubscriptionByUserId,
  createSubscription,
  cancelSubscription,
};
