import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/invitations/:token - Get group preview (Requires Auth because of PRD flow)
router.get('/:token', requireAuth, async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid or expired invitation link.' });
    }

    const invitationWithGroup = invitation as unknown as {
      group: {
        id: string;
        name: string;
        _count: {
          members: number;
        };
      };
    };

    res.json({
      group: {
        id: invitationWithGroup.group.id,
        name: invitationWithGroup.group.name,
        memberCount: invitationWithGroup.group._count.members
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invitation details.' });
  }
});

// POST /api/invitations/:token/accept - Accept invitation
router.post('/:token/accept', requireAuth, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;
    const userName = req.user.name;

    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { token }
      });

      if (!invitation) {
        throw new Error('Invalid or expired invitation link.');
      }

      // Check if already a member
      const existingMember = await tx.groupMember.findFirst({
        where: {
          userId,
          groupId: invitation.groupId
        }
      });

      if (existingMember) {
        return { groupId: invitation.groupId, message: 'Already a member' };
      }

      // Add to group
      await tx.groupMember.create({
        data: {
          userId,
          groupId: invitation.groupId
        }
      });

      // Log activity
      await tx.activity.create({
        data: {
          groupId: invitation.groupId,
          message: `${userName} joined the group via invitation link.`
        }
      });

      return { groupId: invitation.groupId };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : '';
    if (message === 'Invalid or expired invitation link.') {
      return res.status(404).json({ error: message });
    }
    res.status(500).json({ error: 'Failed to accept invitation.' });
  }
});

export default router;
