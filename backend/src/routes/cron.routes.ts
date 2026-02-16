import { Router } from 'express';
import { checkExpiredSubscriptions } from '../controllers/cron.controller';

const router = Router();

// expire subscription
router.get('/check-subscriptions', checkExpiredSubscriptions);

export default router;