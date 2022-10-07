import { Prisma } from '@prisma/client';

type ApiSurface = {
  prisma: {
    server: {
      getServer: () => Promise<Prisma.ServerSelect>;
    };
  };
};

declare global {
  interface Window {
    electron: ApiSurface;
  }
}
