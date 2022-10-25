import express, { Router } from 'express';

export const router: Router = express.Router({ mergeParams: true });

router.post('/scan', async (_req, res) => {
  return res.status(200);
});

router.post('/', async (_req, res) => {
  return res.status(200).json({});
});
