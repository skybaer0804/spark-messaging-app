const express = require('express');
const router = express.Router();
const {
  getWorkspaces,
  createWorkspace,
  createCompany,
  createDept,
  getWorkspaceStructure,
  getWorkspacePrivateKey,
} = require('../controllers/workspaceController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getWorkspaces);
router.get('/:workspaceId/private-key', getWorkspacePrivateKey);
router.post('/', createWorkspace);
router.post('/company', createCompany);
router.post('/dept', createDept);
router.get('/:workspaceId/structure', getWorkspaceStructure);

module.exports = router;
