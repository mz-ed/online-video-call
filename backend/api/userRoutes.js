const express = require('express');
const router  = express.Router();
const prisma  = require('../db/dbClient');

// GET /api/users/:id — get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id:        true,
        username:  true,
        email:     true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('[userRoutes] GET /:id', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users — create user (called by your auth service after signup)
router.post('/', async (req, res) => {
  const { id, username, email } = req.body;

  if (!id || !username || !email)
    return res.status(400).json({ error: 'id, username and email are required' });

  try {
    const user = await prisma.user.upsert({
      where:  { id },
      update: { username, email },
      create: { id, username, email, password: '' },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('[userRoutes] POST /', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;