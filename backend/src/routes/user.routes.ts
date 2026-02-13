import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { addContact, removeContact, toggleFavorite, getContacts, updateContactName } from '../controllers/contact.controller';
import { blockUser, unblockUser } from '../controllers/block.controller';

const router = Router();

router.use(protect);

// contacts api
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.put('/contacts/:contactId', updateContactName);
router.delete('/contacts/:contactId', removeContact);
router.patch('/contacts/:contactId/favorite', toggleFavorite);

// block api
router.post('/blocks', blockUser);
router.delete('/blocks/:blockedId', unblockUser);

export default router;