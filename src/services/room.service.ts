// managa rooms and applied logic using roomStore.ts data 
import { v4 as uuidv4 } from 'uuid';

export type RoomStatus = 'waiting' | 'active' | 'finished';

// interface for every room
export interface Room {
  roomId: string;
  roomCode: string;
  hostUserId: string;
  maxPlayers: number;
  players: string[]; // userIds
  status: RoomStatus;
  createdAt: string;
}

// in-memory storage for rooms, using a Map for easy access by roomId
const rooms: Map<string, Room> = new Map();

// helper to generate unique room codes
function generateRoomCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// create a new room
export function createRoom(hostUserId: string, maxPlayers = 8): Room {
  let code = generateRoomCode();
  // avoid dupes, check for every existing room code not equal to the new one
  while ([...rooms.values()].some(r => r.roomCode === code)) {
    code = generateRoomCode();
  }

  // create room object with unique ID and code
  const roomId = uuidv4();
  // create the room using the interface
  const room: Room = {
    roomId,
    roomCode: code,
    hostUserId,
    maxPlayers,
    players: [hostUserId],
    status: 'waiting',
    createdAt: new Date().toISOString(),
  };

  rooms.set(roomId, room);
  return room;
}

//#region:getter functions
export function getRoomById(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): Room | undefined {
  return [...rooms.values()].find(r => r.roomCode === code);
}
//#endregion



// add a player to a room. Returns the updated room or null if failed
export function addPlayerToRoom(roomId: string, userId: string): Room | null {
  const room = rooms.get(roomId); // get the room by ID
  if (!room) return null; // room doesn't exist
  if (room.players.includes(userId)) return room; // already in room
  if (room.players.length >= room.maxPlayers) return null; // room full

  room.players.push(userId); // add player 
  rooms.set(roomId, room); // update the room in the map
  return room; 
}

// remove a player from a room. Returns the updated room or null if failed
export function removePlayerFromRoom(roomId: string, userId: string): Room | null {
  const room = rooms.get(roomId); // get the room by ID
  if (!room) return null; // room doesn't exist
  const idx = room.players.indexOf(userId); // find player index

  // if idx == -1 then player not in room (typescript will return -1 if the element is not found)
  if (idx === -1) return room; 

  room.players.splice(idx, 1); // remove player from array
  rooms.set(roomId, room); // update the room in the map
  return room;
}
