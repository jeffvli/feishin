import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from './prisma';

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, String(process.env.TOKEN_SECRET), {
    expiresIn: String(process.env.TOKEN_EXPIRATION || '15m'),
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, String(process.env.TOKEN_SECRET), {
    expiresIn: String(process.env.TOKEN_REFRESH_EXPIRATION || '90d'),
  });
};

const authenticateUser = async (
  username: string,
  password: string,
  done: any
) => {
  const user = await prisma.user.findUnique({ where: { username } });

  if (user === null || user === undefined) {
    return done(null, false);
  }

  if (!user.enabled) {
    return done(null, false, { message: 'The user is not enabled.' });
  }

  if (await bcrypt.compare(password, user.password)) {
    return done(null, user);
  }

  return done(null, false, { message: 'Invalid credentials.' });
};

passport.use(new LocalStrategy(authenticateUser));

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: String(process.env.TOKEN_SECRET),
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwt_payload: any, done: any) => {
    await prisma.user
      .findUnique({
        include: {
          serverFolderPermissions: true,
          serverPermissions: true,
        },
        where: { id: jwt_payload.id },
      })
      .then((user) => {
        // eslint-disable-next-line promise/no-callback-in-promise
        return done(null, user);
      })
      .catch((err) => {
        console.log(err.message);
      });
  })
);

passport.serializeUser((user: any, done) => {
  return done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  return done(
    null,
    await prisma.user.findUnique({
      where: {
        id,
      },
    })
  );
});
