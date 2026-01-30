import { db } from '../db';
import type { Meme } from '../store/roomStore';

// function to pick a random meme from the database
export async function pickRandomMeme(): Promise<Meme> {
    // expected return RowDataPacket[]
    const [rows] = await db.query(
        `SELECT id, video_url, title
        FROM memes
            WHERE is_active = 1
                ORDER BY RAND()
        LIMIT 1`
    );

    // typing result with the expected fields
    const typedRows = rows as Array<{
        id: number;
        video_url: string;
        title: string | null
    }>;

    // if no meme found, throw an error
    if (!typedRows.length) {
        throw new Error('No memes available');
    }

    // mapping for correct return type
    const m = typedRows[0];
    console.log('[meme] selected', { id: m.id, title: m.title });
    return { id: m.id, videoUrl: m.video_url, title: m.title };
}
