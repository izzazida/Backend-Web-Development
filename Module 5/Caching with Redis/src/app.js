'use strict';

require('dotenv').config();

const express = require('express');
const db = require('./db');
const { cacheGet, cacheSet, cacheDel } = require('./cache');

const app = express();
app.use(express.json());

const FEED_KEY = 'feed:trending';
const FEED_TTL = 60;

app.get('/health', (req, res) => res.json({ ok: true }));

// GET /feed — cache-aside pattern
app.get('/feed', async (req, res) => {
  try {
    const cachedPosts = await cacheGet(FEED_KEY);

    // Cache HIT
    if (cachedPosts !== null && cachedPosts !== undefined) {
      res.set('X-Cache', 'HIT');
      console.log('[feed] Cache HIT');
      return res.json(cachedPosts);
    }

    // Cache MISS — fetch from database
    const t0 = Date.now();
    const posts = await db.getTrendingPosts();

    await cacheSet(FEED_KEY, posts, FEED_TTL);

    res.set('X-Cache', 'MISS');
    console.log(`[feed] Cache MISS — DB ${Date.now() - t0}ms`);

    return res.json(posts);

  } catch (err) {
    console.error('[feed] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /posts — create post and invalidate cache
app.post('/posts', async (req, res) => {
  try {
    const post = await db.createPost(req.body);

    await cacheDel(FEED_KEY);

    res.status(201).json(post);
  } catch (err) {
    console.error('[posts] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };