import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { roomStore } from '../store/roomStore';

const router = Router();

router.post('/', (req, res) => {
    const { hostUserId, maxPlayers } = req.body;

    // create room object
    const room = {
        roomId: uuid(),
        roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        hostUserId,
        maxPlayers,
        players: [hostUserId],
        status: 'waiting' as const,
        createdAt: new Date().toISOString(),
    };

    roomStore.create(room); // store the room
    res.json(room);
});

export default router;
