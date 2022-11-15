/* eslint-disable import/order */
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import 'express-async-errors';
import { errorHandler } from '@/middleware';
import { routes } from '@routes/index';
import { sockets } from '@sockets/index';
import * as http from 'http';
import * as socketio from 'socket.io';

require('./lib/passport');

const PORT = 9321;

const app = express();
const staticPath = path.join(__dirname, '../feishin-client/');
const filesPath = path.join(__dirname, './files/');

app.use(express.static(staticPath));
app.use('/files', express.static(filesPath));
app.use(
  cors({
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    origin: [`http://localhost:4343`, `${process.env.APP_BASE_URL}`],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.use(routes);
app.use(errorHandler);

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    credentials: false,
    methods: ['GET', 'POST'],
    origin: [`http://localhost:4343`, `${process.env.APP_BASE_URL}`],
  },
});

app.set('socketio', io);
io.on('connection', (socket) => sockets(socket, io));

server.listen(9321, () => console.log(`Listening on port ${PORT}`));
