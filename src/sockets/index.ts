import { Server, Socket } from 'socket.io';
import { roomStore } from '../store/roomStore';

// all event handlers related to the game socket
export function registerSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('joinRoom', ({ userId, roomId }) => {
            console.log('joinRoom handler called with:', { userId, roomId });

            const room = roomStore.get(roomId);

            if (!room) {
                socket.emit('errorMessage', {
                    message: 'Impossible de rejoindre la room (inexistante ou pleine)',
                });
                return;
            }

            if (room.players.includes(userId)) return;

            if (room.players.length >= room.maxPlayers) {
                socket.emit('errorMessage', {
                    message: 'Room pleine',
                });
                return;
            }

            room.players.push(userId);
            roomStore.update(roomId, { players: room.players });

            socket.join(roomId);

            io.to(roomId).emit('roomData', {
                players: room.players.map(p => ({ userId: p })),
            });

            io.to(roomId).emit('playerJoined', { userId });
        });
    });
}
