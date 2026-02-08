const express = require('express');
const router = express.Router();
const {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  getWorkspacePrivateKey,
  joinWorkspace,
  updateWorkspace,
} = require('../controllers/workspaceController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getWorkspaces);
router.get('/:workspaceId', getWorkspace);
router.get('/:workspaceId/private-key', getWorkspacePrivateKey);
router.post('/', createWorkspace);
router.patch('/:workspaceId', updateWorkspace);
router.post('/:workspaceId/join', joinWorkspace);

module.exports = router;
