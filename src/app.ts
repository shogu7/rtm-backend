import { Room } from './services/room.service';
import express from 'express';
import cors from 'cors';

//#region: import routes
import roomRoutes from './routes/room.routes';
import { memeRouter } from './routes/meme.routes';
//#endregion

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/rooms', roomRoutes);
console.log("Room routes initialized ✅.");

app.use('/api/memes', memeRouter);
console.log("Meme routes initialized ✅.");

console.log("All routes initialized ✅. (normally ^^)");

export default app;
