import { Server, Socket } from 'socket.io';
import { roomStore } from '../store/roomStore';
import { pickRandomMeme } from '../services/meme.service';

// payload interface for joinRoom event
interface JoinRoomPayload {
  userId: string;
  roomId: string;
}

const userRoomSockets = new Map<string, string>();

// generate a unique key for each user-room combination
function getUserRoomKey(userId: string, roomId: string) {
  return `${roomId}:${userId}`;
}

//#region:each time a client connects, this function sets up the event handlers
export function onGameSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('joinRoom', (payload: JoinRoomPayload) => {
      const { userId, roomId } = payload;

      // debug log
      console.log('[joinRoom] payload:', payload);

      const room = roomStore.get(roomId); // get the room by ID

      // if the room doesn't exist, emit an error
      if (!room) {
        socket.emit('errorMessage', {
          message: 'Impossible de rejoindre la room',
        });
        return;
      }

      const userRoomKey = getUserRoomKey(userId, roomId);
      const existingSocketId = userRoomSockets.get(userRoomKey);
      if (existingSocketId && existingSocketId !== socket.id) {
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.leave(roomId);
          existingSocket.disconnect(true);
        }
      }
      userRoomSockets.set(userRoomKey, socket.id);

      // if the user is already in the room, just join the socket to the room and emit current data
      if (room.players.includes(userId)) {
        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;
        socket.emit('roomData', {
          players: room.players.map(p => ({ userId: p })),
          status: room.status,
          phase: (room as any).phase,
          meme: room.currentMeme ?? null,
        });
        return;
      }

      // if the room is full, emit an error
      if (room.players.length >= room.maxPlayers) {
        socket.emit('errorMessage', {
          message: 'Room pleine',
        });
        return;
      }

      // add the player to the room
      room.players.push(userId);
      // update the room in the store
      roomStore.update(roomId, { players: room.players });

      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // emit to all clients in the room that a new player has joined
      io.to(roomId).emit('roomData', {
        // for each player, send an object with userId
        players: room.players.map((p) => ({ userId: p })),
        status: room.status,
        phase: (room as any).phase,
        meme: room.currentMeme ?? null,
      });

      console.log(`[joinRoom] ${userId} joined room ${roomId}`);
    });
    //#endregion

    //#region:event to disconnect
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', socket.id, 'reason:', reason);

      const { userId, roomId } = socket.data;
      if (!userId || !roomId) return;

      const userRoomKey = getUserRoomKey(userId, roomId);
      if (userRoomSockets.get(userRoomKey) === socket.id) {
        userRoomSockets.delete(userRoomKey);
      }

      const room = roomStore.get(roomId);
      if (!room) return;

      const updatedPlayers = room.players.filter(p => p !== userId);

      if (room.hostUserId === userId) {
        if (updatedPlayers.length === 0) {
          console.log('[room] deleted (host left, empty)', { roomId, hostUserId: userId });
          roomStore.delete(roomId);
          return;
        } else {
          roomStore.update(roomId, {
            players: updatedPlayers,
            hostUserId: updatedPlayers[0],
          });

          io.to(roomId).emit('hostChanged', {
            hostUserId: updatedPlayers[0],
          });
        }
      } else {
        roomStore.update(roomId, { players: updatedPlayers });
      }

      const updatedRoom = roomStore.get(roomId);
      if (!updatedRoom) return;

      io.to(roomId).emit('roomData', {
        players: updatedPlayers.map(p => ({ userId: p })),
        status: updatedRoom.status,
        phase: (updatedRoom as any).phase,
        meme: updatedRoom.currentMeme ?? null,
      });
    });
    //#endregion

    //#region:event to start the game
    socket.on('startGame', async (payload: { userId: string; roomId: string }) => {
      const { userId, roomId } = payload;
      const room = roomStore.get(roomId);

      // debug log
      console.log('[startGame] payload:', payload);

      if (!room) {
        socket.emit('errorMessage', { message: 'Room not found' });
        return;
      }

      // only the host can start the game
      if (room.hostUserId !== userId) {
        socket.emit('errorMessage', { message: 'Only the host can start the game' });
        return;
      }

      // the game can only be started if the room is in 'waiting' status
      if (room.status !== 'waiting') {
        console.log('[startGame]', {
          roomId,
          currentStatus: room.status,
        });
        socket.emit('roomData', {
          players: room.players.map(p => ({ userId: p })), // for each player, send an object with userId
          status: room.status, // current status
          phase: (room as any).phase, // current phase
          meme: room.currentMeme ?? null, // current meme
        });
        return;
      }

      if (!room.currentMeme) {
        try {
          const meme = await pickRandomMeme();
          roomStore.update(roomId, { currentMeme: meme });
        } catch (err) {
          console.error('[startGame] pickRandomMeme failed:', err);
          socket.emit('errorMessage', { message: 'No memes available' });
          return;
        }
      }

      // update the room status AND phase
      const updatedRoom = roomStore.update(roomId, {
        status: 'playing',
        phase: 'startGame',
      });

      // if the update failed, emit an error
      if (!updatedRoom) {
        socket.emit('errorMessage', { message: 'Impossible de démarrer la partie' });
        return;
      }

      // emit the updated room to all clients
      io.to(roomId).emit('roomData', {
        players: updatedRoom.players.map(p => ({ userId: p })),
        status: updatedRoom.status,
        phase: updatedRoom.phase,
        meme: updatedRoom.currentMeme ?? null,
      });

      console.log('[startGame] started', {
        roomId,
        memeId: updatedRoom.currentMeme?.id ?? null,
      });
    });

  });
  //#endregion
}
