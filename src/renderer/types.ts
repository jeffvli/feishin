import { AppRoute } from './router/routes';

export interface CardRow {
  align?: 'left' | 'center' | 'right';
  prop: string;
  route?: {
    prop: string;
    route: AppRoute | string;
  };
}
