import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const activityService = {
  logActivity: async (groupId: string, message: string) => {
    try {
      await prisma.activity.create({
        data: {
          groupId,
          message,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },
};
