const express = require('express');
const router  = express.Router();
const prisma  = require('../db/dbClient');

// POST /api/rooms — create a room
router.post('/', async (req, res) => {
  const { name, hostId } = req.body;

  if (!name || !hostId)
    return res.status(400).json({ error: 'name and hostId are required' });

  try {
    const room = await prisma.room.create({
      data: { name, hostId },
    });

    res.status(201).json(room);
  } catch (err) {
    console.error('[roomRoutes] POST /', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rooms/:id — get room info
router.get('/:id', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        host: {
          select: { id: true, username: true },
        },
      },
    });

    if (!room)       return res.status(404).json({ error: 'Room not found' });
    if (!room.isActive) return res.status(410).json({ error: 'Room is closed' });

    res.json(room);
  } catch (err) {
    console.error('[roomRoutes] GET /:id', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rooms — get all rooms by host
router.get('/', async (req, res) => {
  const { hostId } = req.query;

  if (!hostId)
    return res.status(400).json({ error: 'hostId query param is required' });

  try {
    const rooms = await prisma.room.findMany({
      where:   { hostId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rooms);
  } catch (err) {
    console.error('[roomRoutes] GET /', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/rooms/:id — close a room
router.delete('/:id', async (req, res) => {
  const { hostId } = req.body;

  if (!hostId)
    return res.status(400).json({ error: 'hostId is required' });

  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
    });

    if (!room)          return res.status(404).json({ error: 'Room not found' });
    if (room.hostId !== hostId) return res.status(403).json({ error: 'Only the host can close this room' });

    const updated = await prisma.room.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    });

    res.json(updated);
  } catch (err) {
    console.error('[roomRoutes] DELETE /:id', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;