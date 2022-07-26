import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import 'express-async-errors';
import { errorHandler } from './middleware';
import { routes } from './routes';

require('./lib/passport');

const PORT = 9321;

const app = express();
const staticPath = path.join(__dirname, '../sonixd-client/');

app.use(express.static(staticPath));
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

app.listen(9321, () => console.log(`Listening on port ${PORT}`));
