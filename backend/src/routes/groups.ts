import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { requireAdult } from '../middleware/requireAdult';
import { prisma, isDbConnected } from '../lib/prisma';
import { store, savePersistentStore } from '../lib/persistence';
import { GroupType, MemberRole, BibleTranslation, Denomination } from '@prisma/client';
import { io } from '../index';
import { processMessageModeration } from '../services/moderationService';

const router = Router();
router.use(requireAuth);

// ─── GET /api/groups ─────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, search, denomination, translation, parentGroupId } = req.query;

    if (!isDbConnected()) {
      let filtered = store.groups;
      if (type) filtered = filtered.filter((g: any) => g.type === type);
      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter((g: any) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
      }
      res.json(filtered);
      return;
    }

    const groups = await prisma.group.findMany({
      where: {
        ...(type && { type: type as GroupType }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
        ...(denomination && { denominationTag: denomination as Denomination }),
        ...(translation && { bibleTranslation: translation as BibleTranslation }),
        ...(parentGroupId ? { parentGroupId: parentGroupId as string } : { parentGroupId: null }),
        isPrivate: false,
      },
      include: {
        _count: { select: { members: true } },
        createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(groups);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      const type = req.query.type;
      let filtered = store.groups;
      if (type) {
        filtered = filtered.filter((g: any) => g.type === type);
      }
      res.json(filtered);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/groups — create group (adult only) ───────────────────────────
router.post('/', requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name, description, type, isPrivate, maxMembers, requiresApproval,
      parentGroupId, bibleTranslation, denominationTag, studyFocus,
    } = req.body;

    if (!name?.trim() || !type) {
      res.status(400).json({ error: 'name and type are required' }); return;
    }

    const validTypes = Object.values(GroupType);
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid group type' }); return;
    }

    let group;
    try {
      // If creating a sub-group, verify parent exists
      if (parentGroupId) {
        const parent = await prisma.group.findUnique({ where: { id: parentGroupId } });
        if (!parent) { res.status(404).json({ error: 'Parent group not found' }); return; }
      }

      group = await prisma.group.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          type,
          isPrivate: isPrivate ?? false,
          maxMembers: maxMembers ? parseInt(maxMembers) : null,
          requiresApproval: requiresApproval ?? false,
          parentGroupId: parentGroupId || null,
          createdById: req.dbUserId || 'dev_db_user_123',
          bibleTranslation: bibleTranslation || null,
          denominationTag: denominationTag || null,
          studyFocus: studyFocus?.trim() || null,
        },
      });

      // Auto-add creator as admin member
      await prisma.groupMember.create({
        data: { userId: req.dbUserId || 'dev_db_user_123', groupId: group.id, role: MemberRole.admin },
      });
    } catch {
      if (process.env.NODE_ENV === 'development') {
        const newGroup = {
          id: `group_dev_${Date.now()}`,
          name: name.trim(),
          description: description?.trim() || null,
          type,
          isPrivate: Boolean(isPrivate),
          maxMembers: maxMembers ? parseInt(maxMembers) : null,
          requiresApproval: requiresApproval ?? false,
          parentGroupId: parentGroupId || null,
          createdById: req.dbUserId || 'dev_db_user_123',
          createdAt: new Date().toISOString(),
          _count: { members: 1 },
          createdBy: { id: 'dev_db_user_123', displayName: 'Flourish Faith', avatarUrl: null },
        };
        store.groups.unshift(newGroup);
        savePersistentStore();
        res.status(201).json(newGroup);
        return;
      }
      throw new Error('Database error');
    }

    res.status(201).json(group);
  } catch (err) {
    console.error('[Groups] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/groups/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      const found = store.groups.find((g: any) => g.id === req.params.id) || store.groups[0];
      res.json({
        ...found,
        members: [{ user: { id: 'dev_db_user_123', displayName: 'Flourish Faith', avatarUrl: null } }],
        subGroups: [],
      });
      return;
    }

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { isPending: false },
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
          take: 20,
        },
        subGroups: {
          where: { isPrivate: false },
          select: { id: true, name: true, type: true, _count: { select: { members: true } } },
        },
        createdBy: { select: { id: true, displayName: true } },
      },
    });

    if (!group) {
      if (process.env.NODE_ENV === 'development') {
        const found = store.groups.find((g: any) => g.id === req.params.id);
        if (found) {
          res.json({
            ...found,
            members: [{ user: { id: 'dev_db_user_123', displayName: 'Flourish Faith', avatarUrl: null } }],
            subGroups: [],
          });
          return;
        }
      }
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    res.json(group);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      const found = store.groups.find((g: any) => g.id === req.params.id) || store.groups[0];
      res.json({
        ...found,
        members: [{ user: { id: 'dev_db_user_123', displayName: 'Flourish Faith', avatarUrl: null } }],
        subGroups: [],
      });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/groups/:id/join ────────────────────────────────────────────────
router.post('/:id/join', requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

    // Check max members
    if (group.maxMembers) {
      const count = await prisma.groupMember.count({ where: { groupId: group.id, isPending: false } });
      if (count >= group.maxMembers) {
        res.status(400).json({ error: 'Group is full' }); return;
      }
    }

    const membership = await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: req.dbUserId!, groupId: group.id } },
      create: {
        userId: req.dbUserId!,
        groupId: group.id,
        role: MemberRole.member,
        isPending: group.requiresApproval,
      },
      update: {},
    });

    res.json({
      membership,
      message: group.requiresApproval
        ? 'Join request submitted — awaiting admin approval'
        : 'Joined group successfully',
    });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// ─── GET /api/groups/:id/messages ─────────────────────────────────────────────
router.get('/:id/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || '50'), 100);

    // Verify membership (or public group)
    const group = await prisma.group.findUnique({ where: { id }, select: { isPrivate: true } });
    if (!group) { res.status(404).json({ error: 'Group not found' }); return; }

    if (group.isPrivate) {
      const member = await prisma.groupMember.findFirst({
        where: { groupId: id, userId: req.dbUserId, isPending: false },
      });
      if (!member) { res.status(403).json({ error: 'Not a member of this group' }); return; }
    }

    const messages = await prisma.message.findMany({
      where: {
        groupId: id,
        moderationStatus: { not: 'auto_rejected' },
        ...(cursor && { id: { lt: cursor } }),
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ messages: messages.reverse(), hasMore: messages.length === limit });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// ─── POST /api/groups/:id/messages ────────────────────────────────────────────
router.post('/:id/messages', requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) {
      res.status(400).json({ error: 'Message must have content or media' }); return;
    }

    // Verify membership
    const member = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: req.dbUserId, isPending: false },
    });
    if (!member) { res.status(403).json({ error: 'Not a member of this group' }); return; }

    const message = await prisma.message.create({
      data: {
        groupId: id,
        senderId: req.dbUserId!,
        content,
        mediaUrl,
        mediaType,
        moderationStatus: 'pending',
      },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    // Run moderation async and emit after
    processMessageModeration(message.id).then(async () => {
      const updated = await prisma.message.findUnique({
        where: { id: message.id },
        include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
      });
      if (updated && updated.moderationStatus !== 'auto_rejected') {
        io.to(`group:${id}`).emit('message:new', updated);
      }
    }).catch(console.error);

    io.to(`group:${id}`).emit('message:new', message);
    res.status(201).json(message);
  } catch (err) {
    console.error('[Groups] send message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/groups/:id ────────────────────────────────────────────────────
router.patch('/:id', requireAdult, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const member = await prisma.groupMember.findFirst({
      where: { groupId: req.params.id, userId: req.dbUserId, role: { in: [MemberRole.admin, MemberRole.moderator] } },
    });
    if (!member) { res.status(403).json({ error: 'Admin or moderator access required' }); return; }

    const { name, description, isPrivate, maxMembers, requiresApproval } = req.body;
    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(maxMembers !== undefined && { maxMembers }),
        ...(requiresApproval !== undefined && { requiresApproval }),
      },
    });

    res.json(group);
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
