import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { roomStore } from '../store/roomStore';

const router = Router();


// endpoint to create a new room
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
        phase: 'waiting' as const,
        createdAt: new Date().toISOString(),
        currentMeme: null, 
    };

    roomStore.create(room); // store the room
    console.log('[room] created', {
        roomId: room.roomId,
        roomCode: room.roomCode,
        hostUserId: room.hostUserId,
        maxPlayers: room.maxPlayers,
        status: room.status,
    });
    res.json(room);
});

// endpoint to get room by code
router.get('/id/:roomId', (req, res) => {
    const { roomId } = req.params;

    const room = roomStore.get(roomId);

    if (!room) {
        res.status(404).json({ message: 'Room introuvable' });
        return;
    }
    

    res.json({
        roomId: room.roomId,
        roomCode: room.roomCode,
        hostUserId: room.hostUserId,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
    });
});

// endpoint to get room by code
router.get('/code/:roomCode', (req, res) => {
  const { roomCode } = req.params;

  // roomStore.getByCode method to get room using its code
  const room = roomStore.getByCode(roomCode);

  if (!room) {
    res.status(404).json({ message: 'Room introuvable' });
    return;
  }

  res.json({
    roomId: room.roomId,
    roomCode: room.roomCode,
    hostUserId: room.hostUserId,
    players: room.players,
    maxPlayers: room.maxPlayers,
    status: room.status,
    currentMeme: null, 
  });
});


export default router;
