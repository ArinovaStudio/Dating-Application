import { Router } from 'express';
import { protect, restrictToPaid } from '../middlewares/auth.middleware';
import { addContact, removeContact, toggleFavorite, getContacts, updateContactName } from '../controllers/contact.controller';
import { blockUser, unblockUser } from '../controllers/block.controller';
import { cancelSearch, getOnlineMatches, searchRandomMatch } from '../controllers/match.controller';
import { getCallHistory, getMyProfile, updateProfile } from '../controllers/user.controller';
import { validateRequest } from '../middlewares/validate-request';
import { userValidators } from '../middlewares/user.validator';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(protect);

// match apis
router.get('/matches', getOnlineMatches); // list of matches
router.post('/matches/search', searchRandomMatch);
router.post('/matches/cancel', cancelSearch);

// contacts / friends api
router.get('/contacts', restrictToPaid, getContacts);
router.post('/contacts', restrictToPaid, addContact);
router.put('/contacts/:contactId', restrictToPaid, updateContactName);
router.delete('/contacts/:contactId', restrictToPaid, removeContact);
router.patch('/contacts/:contactId/favorite', restrictToPaid, toggleFavorite);

// block api
router.post('/blocks', blockUser);
router.delete('/blocks/:blockedId', unblockUser);

// calls apis
router.get('/calls/history', getCallHistory);

// profile apis
router.get('/profile', getMyProfile);
router.put('/profile', upload.single('avatar'), userValidators.updateProfile, validateRequest, updateProfile);

export default router;