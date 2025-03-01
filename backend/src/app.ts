import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import globalErrorHandler from 'controllers/errorContoller';
import authRoutes from 'routes/authRouter';
import communitiesRoutes from 'routes/communitiesRouter';

const app: Express = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v0/auth', authRoutes);
app.use('/api/v0/communities', communitiesRoutes);

app.use(globalErrorHandler);

export default app;