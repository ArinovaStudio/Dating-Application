import { Router } from 'express';
import { createPlan, getAllPlans, updatePlan, deletePlan, updateSystemConfig } from '../controllers/admin.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { adminValidators } from '../middlewares/admin.validator';
import { validateRequest } from '../middlewares/validate-request';


const router = Router();

router.get(
    '/plans', 
    getAllPlans
);

router.use(protect);
router.use(restrictTo('ADMIN'));

router.post(
    '/plans',
    adminValidators.createPlan, 
    validateRequest,
    createPlan
);

router.put(
    '/plans/:id',
    adminValidators.updatePlan,
    validateRequest, 
    updatePlan
);

router.delete(
    '/plans/:id', 
    deletePlan
);

router.put(
    '/config',
    adminValidators.updateConfig,
    validateRequest,
    updateSystemConfig
);

export default router;