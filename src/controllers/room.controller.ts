import { Request, Response } from 'express';
import { createRoom, getRoomByCode, addPlayerToRoom } from '../services/room.service';

export const createRoomController = (req: Request, res: Response) => {
  const hostUserId = String(req.body.hostUserId || '');
  const maxPlayers = Number(req.body.maxPlayers || 5);

  if (!hostUserId || !maxPlayers) {
    return res.status(400).json({ error: 'hostUserId et maxPlayers requis' });
  }

  const room = createRoom(hostUserId, maxPlayers);
  return res.json(room);
};

export const getRoomController = (req: Request, res: Response) => {
  const code = String(req.params.code || '');
  const room = getRoomByCode(code);

  if (!room) return res.status(404).json({ error: 'Room non trouvée' });

  return res.json(room);
};

export const joinRoomController = (req: Request, res: Response) => {
  const roomId = String(req.params.roomId || '');
  const userId = String(req.body.userId || '');

  if (!userId) return res.status(400).json({ error: 'userId requis' });

  const room = addPlayerToRoom(roomId, userId);
  if (!room) return res.status(400).json({ error: 'Impossible de rejoindre la room' });

  return res.json({ message: 'Rejoint la room avec succès', room });
};
