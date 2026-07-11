import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { createSettlementSchema } from '../lib/schemas';
import { asyncHandler } from '../middleware/validate';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// POST /api/groups/:groupId/settlements - Create a new settlement
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const { payerId, payeeId, amount } = createSettlementSchema.parse(req.body);

  // 1. Verify that the current user is a member of the group
  const isMember = await prisma.groupMember.findFirst({
    where: { groupId, userId }
  });
  if (!isMember) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // 2. Verify that payer and payee are members of the group
  const payerMember = await prisma.groupMember.findFirst({
    where: { groupId, userId: payerId }
  });
  const payeeMember = await prisma.groupMember.findFirst({
    where: { groupId, userId: payeeId }
  });

  if (!payerMember || !payeeMember) {
    return res.status(400).json({ error: 'Payer and Payee must be members of the group' });
  }

  const result = await prisma.$transaction(async (tx) => {
    // A. Create settlement
    const settlement = await tx.settlement.create({
      data: {
        groupId,
        payerId,
        payeeId,
        amount
      }
    });

    // B. Fetch payer and payee names for activity message
    const payerUser = await tx.user.findUnique({ where: { id: payerId } });
    const payeeUser = await tx.user.findUnique({ where: { id: payeeId } });
    const payerName = payerUser?.name || 'Unknown';
    const payeeName = payeeUser?.name || 'Unknown';

    // C. Log activity
    await tx.activity.create({
      data: {
        groupId,
        message: `${payerName} settled ₹${amount} with ${payeeName}`
      }
    });

    return settlement;
  });

  res.status(201).json(result);
}));

export default router;
