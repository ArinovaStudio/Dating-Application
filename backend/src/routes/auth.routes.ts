import { Router } from 'express';
import { register, login, sendOtp, verifyOtp, completeProfile, logout } from '../controllers/auth.controller';
import { authValidators } from '../middlewares/auth.validator';
import { validateRequest } from '../middlewares/validate-request';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authValidators.register, validateRequest, register);
router.post('/complete-profile', protect, authValidators.completeProfile, validateRequest, completeProfile );
router.post('/login', authValidators.login, validateRequest, login);
router.post('/logout', protect, logout );

// otp routes
router.post('/otp/send', authValidators.otp, validateRequest, sendOtp);
router.post('/otp/verify', authValidators.verifyOtp, validateRequest, verifyOtp);

export default router;