import express from 'express';
import * as addressController from '../controllers/addressController.js';
import { protectUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectUser, addressController.list);
router.post('/', protectUser, addressController.create);
router.put('/:id', protectUser, addressController.update);
router.delete('/:id', protectUser, addressController.remove);
router.patch('/:id/default', protectUser, addressController.setDefault);

export default router;
