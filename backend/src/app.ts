import express, { Express } from 'express';
import globalErrorHandler from 'controllers/error.contoller';
import authRoutes from 'routes/auth.router';

const app: Express = express();

app.use(express.json());
app.use('/api/v0/auth', authRoutes);

app.use(globalErrorHandler);

export default app;