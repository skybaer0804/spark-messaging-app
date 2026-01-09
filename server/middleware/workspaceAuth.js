const User = require('../models/User');

/**
 * 워크스페이스 권한 검증 미들웨어
 * 요청된 workspaceId가 해당 유저의 소속 워크스페이스인지 확인
 */
module.exports = async (req, res, next) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId || req.body.workspaceId;
    
    if (!workspaceId) {
      // workspaceId가 없는 경우, 일부 공통 API는 허용하거나 에러 처리
      // 여기서는 엄격하게 에러 처리
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // 유저의 workspaces 배열에 해당 ID가 있는지 확인
    const hasAccess = user.workspaces && user.workspaces.some(ws => ws.toString() === workspaceId);
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'No access to this workspace' });
    }

    // 컨트롤러에서 사용할 수 있도록 req 객체에 저장
    req.workspaceId = workspaceId;
    next();
  } catch (error) {
    console.error('Workspace auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
