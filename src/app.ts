import { Room } from './services/room.service';
import express from 'express';
import cors from 'cors';
import roomRoutes from './routes/room.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/rooms', roomRoutes);
console.log("Room routes initialized ✅.");

export default app;
