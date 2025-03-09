import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import globalErrorHandler from 'controllers/errorContoller';
import authRoutes from 'routes/authRouter';
import communitiesRoutes from 'routes/communitiesRouter';
import communitySettingsRoutes from 'routes/communitySettingsRouter';
import communityModeratorChangeRequestsRoutes from 'routes/comunityModeratorChangeRequestsRouter';

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'))

app.use('/api/v0/auth', authRoutes);
app.use('/api/v0/communities', communitiesRoutes);
app.use('/api/v0/communitySettings', communitySettingsRoutes);
app.use('/api/v0/communityModeratorRequests', communityModeratorChangeRequestsRoutes);

app.use(globalErrorHandler);

export default app;