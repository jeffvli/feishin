import { AppRoute } from './router/utils/routes';

export interface CardRow {
  align?: 'left' | 'center' | 'right';
  prop: string;
  route?: {
    prop: string;
    route: AppRoute | string;
  };
}
