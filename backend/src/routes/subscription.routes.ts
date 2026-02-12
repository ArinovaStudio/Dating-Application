import { Router } from 'express';
import { getMySubscription, getWallet, subscribe } from '../controllers/subscription.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request';
import { body } from 'express-validator';

const router = Router();

router.use(protect);

router.get(
    '/me', 
    getMySubscription
);

router.get(
    "/wallet",
    getWallet
);

router.post(
    '/subscribe',
    body('planId').notEmpty().withMessage('Plan ID is required'),
    validateRequest,
    subscribe
);

export default router;