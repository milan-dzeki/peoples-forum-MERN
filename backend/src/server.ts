import 'module-alias/register'
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import app from './app';

const server = http.createServer(app);

mongoose.connect(process.env.MONGO_DATABASE_CONNECT_STRING!)
  .then(() => {
    console.log('Database connected');
    server.listen(process.env.PORT || 8080, () => {
      console.log('Server connected');
    })
  })
  .catch((error) => {
    console.log(error);
  })