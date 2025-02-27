import express, { Express } from 'express';

const app: Express = express();

app.get('/', (req, res, next) => {
  res.send('helldasdaso');
})

export default app;