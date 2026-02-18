import { Router } from 'express';
import { createPlan, getAllPlans, updatePlan, deletePlan, updateSystemConfig, getSystemConfig, getAllUsers, toggleUserStatus, editUser, deleteUser, getAnalytics } from '../controllers/admin.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { adminValidators } from '../middlewares/admin.validator';
import { validateRequest } from '../middlewares/validate-request';


const router = Router();

router.get('/plans', getAllPlans);

router.use(protect);
router.use(restrictTo('ADMIN'));

// dashboard apis
router.get('/analytics', getAnalytics);

// plan apis
router.post('/plans', adminValidators.createPlan, validateRequest, createPlan);
router.put('/plans/:id', adminValidators.updatePlan, validateRequest, updatePlan);
router.delete('/plans/:id', deletePlan);

// user apis
router.get('/users', getAllUsers);
router.put('/users/:id', editUser);
router.patch('/users/:id/toggle', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// system config apis
router.get('/config', getSystemConfig);
router.put('/config', adminValidators.updateConfig, validateRequest, updateSystemConfig);

export default router;