import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import { balanceService } from '../services/balanceService';
import crypto from 'crypto';
import { createGroupSchema } from '../lib/schemas';
import { asyncHandler } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();

// GET /api/groups - List all groups for the authenticated user
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const groups = await prisma.group.findMany({
    where: {
      id: {
        in: (
          await prisma.groupMember.findMany({
            where: { userId },
            select: { groupId: true },
          })
        ).map((gm) => gm.groupId),
      },
    },
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(groups);
}));

// POST /api/groups - Create a new group
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userName = req.user.name;
  const { name } = createGroupSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the group
    const group = await tx.group.create({
      data: { name },
    });

    // 2. Add creator as member
    await tx.groupMember.create({
      data: {
        userId,
        groupId: group.id,
      },
    });

    // 3. Generate invitation token
    const token = crypto.randomBytes(16).toString('hex');
    await tx.invitation.create({
      data: {
        token,
        groupId: group.id,
      },
    });

    // 4. Log activity
    await tx.activity.create({
      data: {
        groupId: group.id,
        message: `${userName} created the group "${name}"`,
      },
    });

    return {
      ...group,
      _count: { members: 1 }
    };
  });

  res.status(201).json({ group: result });
}));

// GET /api/groups/:id - Get group details
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const group = await prisma.group.findFirst({
    where: {
      id,
      members: { some: { userId } }
    },
    include: {
      _count: { select: { members: true } },
      invitation: { select: { token: true } }
    }
  });

  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
}));

// GET /api/groups/:id/members - Get members with balances
router.get('/:id/members', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify membership
  const isMember = await prisma.groupMember.findFirst({ where: { groupId: id, userId }});
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const members = await balanceService.getMemberBalances(id, userId);
  res.json(members);
}));

// GET /api/groups/:id/activity - Get group activity
router.get('/:id/activity', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const isMember = await prisma.groupMember.findFirst({ where: { groupId: id, userId }});
  if (!isMember) return res.status(403).json({ error: 'Access denied' });

  const activities = await prisma.activity.findMany({
    where: { groupId: id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(activities);
}));

export default router;

