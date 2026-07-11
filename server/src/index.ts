import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import groupsRouter from './routes/groups';
import invitationsRouter from './routes/invitations';
import expensesRouter from './routes/expenses';
import settlementsRouter from './routes/settlements';
import { zodErrorHandler } from './middleware/validate';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

// Better Auth API Route Handler
app.all("/api/auth/*", toNodeHandler(auth));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/groups', groupsRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/groups/:groupId/expenses', expensesRouter); // Group specific expenses
app.use('/api/expenses', expensesRouter); // Global expense actions (detail, edit, delete)
app.use('/api/groups/:groupId/settlements', settlementsRouter); // Group settlements

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Central Error Handling
app.use(zodErrorHandler);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

