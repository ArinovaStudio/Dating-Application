import { Router } from 'express';
import { 
  createPrivateChat, 
  createGroupChat, 
  getMyConversations, 
  getMessages,
  sendMessage,
  deleteMessage,
  addGroupMembers,
  removeGroupMember,
  updateGroupRole,
  leaveGroup,
  editGroup,
  deleteGroup,
  getGroupParticipants
} from '../controllers/chat.controller';
import { protect } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware'; 

const router = Router();

router.use(protect);

// fetch apis
router.get('/', getMyConversations);
router.get('/:conversationId/messages', getMessages);

// create 1 to 1 api
router.post('/private', createPrivateChat);

// group apis
router.post('/group', upload.single('file'), createGroupChat); // create group
router.get('/group/:conversationId', getGroupParticipants);
router.put('/group/:conversationId', upload.single('file'), editGroup); 
router.delete('/group/:conversationId', deleteGroup);

// message apis 
router.post('/message', upload.single('file'), sendMessage);
router.delete('/message/:messageId', deleteMessage);

// group members apis
router.put('/group/:conversationId/add', addGroupMembers);
router.delete('/group/:conversationId/remove', removeGroupMember);
router.put('/group/:conversationId/role', updateGroupRole);
router.delete('/group/:conversationId/leave', leaveGroup);


export default router;