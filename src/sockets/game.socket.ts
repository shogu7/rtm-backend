import { Server, Socket } from 'socket.io';
import { roomStore } from '../store/roomStore';

// payload interface for joinRoom event
interface JoinRoomPayload {
  userId: string;
  roomId: string;
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

      // if the user is already in the room, just join the socket to the room and emit current data
      if (room.players.includes(userId)) {
        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;
        socket.emit('roomData', { players: room.players.map(p => ({ userId: p })) });
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
      });

      console.log(`[joinRoom] ${userId} joined room ${roomId}`);
    });
    //#endregion

    //#region:event to disconnect
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', socket.id, 'reason:', reason);

      const { userId, roomId } = socket.data;
      if (!userId || !roomId) return;

      const room = roomStore.get(roomId);
      if (!room) return;

      const updatedPlayers = room.players.filter(p => p !== userId);

      if (room.hostUserId === userId) {
        if (updatedPlayers.length === 0) {
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

      io.to(roomId).emit('roomData', {
        players: updatedPlayers.map(p => ({ userId: p })),
      });
    });
    //#endregion

    //#region:event to start the game
    socket.on('startGame', (payload: { userId: string; roomId: string }) => {
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
        socket.emit('errorMessage', { message: 'The game has already started' });
        return;
      }

      // update the room status AND phase
      const updatedRoom = roomStore.update(roomId, {
        status: 'playing',
        phase: 'startGame', // <-- ajoute la phase ici
      });

      // si la mise à jour a échoué, on stop
      if (!updatedRoom) {
        socket.emit('errorMessage', { message: 'Impossible de démarrer la partie' });
        return;
      }

      // emit the updated room to all clients
      io.to(roomId).emit('roomData', {
        ...updatedRoom,
        players: updatedRoom.players.map(p => ({ userId: p })), 
        phase: updatedRoom.phase, 
      });

      console.log(`[startGame] the game has started in room ${roomId}`);
    });

  });
}