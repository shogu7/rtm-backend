import { Router } from 'express';
import { db } from '../db';

export const memeRouter = Router();

// GET /api/memes/random
memeRouter.get('/random', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, video_url, title
        FROM memes
            WHERE is_active = 1
                ORDER BY RAND()
        LIMIT 1`
    );

    const typedRows = rows as Array<{
      id: number;
      video_url: string;
      title: string | null;
    }>;

    if (!typedRows.length) {
      throw new Error('No memes available');
    }

    const meme = typedRows[0];
    return res.json({
      id: meme.id,
      videoUrl: meme.video_url,
      title: meme.title,
    });
  } catch (err) {
    console.error('[GET /api/memes/random] error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default memeRouter;