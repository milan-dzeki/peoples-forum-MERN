import express, { Express, Response, NextFunction } from 'express';
import globalErrorHandler from 'controllers/error.contoller';

const app: Express = express();

app.use(express.json());

app.use(globalErrorHandler);

export default app;