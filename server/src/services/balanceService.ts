import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const balanceService = {
  getMemberBalances: async (groupId: string, loggedInUserId: string) => {
    // 1. Fetch all members in the group
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    // 2. Fetch all expenses for the group
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        splits: true
      }
    });

    // 2.5 Fetch all settlements for the group
    const settlements = await prisma.settlement.findMany({
      where: { groupId }
    });

    // 3. Calculate net balances relative to the loggedInUser
    // positive balance = member owes loggedInUser (Receive)
    // negative balance = loggedInUser owes member (Pay)
    
    const balances = new Map<string, number>();
    
    // Initialize balances to 0
    members.forEach(m => {
      if (m.userId !== loggedInUserId) {
        balances.set(m.userId, 0);
      }
    });

    expenses.forEach(expense => {
      const isPayer = expense.creatorId === loggedInUserId;
      
      expense.splits.forEach(split => {
        // If loggedInUser paid, and split is for another member, that member owes loggedInUser
        if (isPayer && split.userId !== loggedInUserId) {
          const current = balances.get(split.userId) || 0;
          balances.set(split.userId, current + split.amount);
        }
        
        // If another member paid, and the split is for loggedInUser, loggedInUser owes that member
        if (!isPayer && split.userId === loggedInUserId) {
          const payerId = expense.creatorId;
          const current = balances.get(payerId) || 0;
          balances.set(payerId, current - split.amount);
        }
      });
    });

    // Incorporate settlements to reduce debt (bring balances closer to zero)
    settlements.forEach(settlement => {
      // If loggedInUser paid payee (X), payee owes loggedInUser more (or loggedInUser paid off debt to payee)
      if (settlement.payerId === loggedInUserId) {
        const current = balances.get(settlement.payeeId) || 0;
        balances.set(settlement.payeeId, current + settlement.amount);
      }
      
      // If payee (X) paid loggedInUser, payee owes loggedInUser less (or X paid off debt to loggedInUser)
      if (settlement.payeeId === loggedInUserId) {
        const current = balances.get(settlement.payerId) || 0;
        balances.set(settlement.payerId, current - settlement.amount);
      }
    });

    return members.map(m => {
      if (m.userId === loggedInUserId) {
        return { ...m.user, balance: 0, isMe: true };
      }
      return { ...m.user, balance: balances.get(m.userId) || 0, isMe: false };
    });

  }
};
