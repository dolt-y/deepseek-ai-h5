import { loginMiniProgram, loginH5, getUserInfo, refreshAuthTokens } from '../services/userService.js';
import { sendError } from '../utils/error.js';
import { isAppError } from '../errors/AppError.js';

function getBearerToken(req) {
  return req.headers.authorization?.replace('Bearer ', '');
}

export async function login(req, res) {
  const { code, userInfo } = req.body;
  try {
    const tokens = await loginMiniProgram(code, userInfo);
    res.json({ ...tokens, msg: '登录成功' });
  } catch (err) {
    sendError(res, err, '微信接口调用失败');
  }
}

export async function loginH5Controller(req, res) {
  const { username, password, userInfo } = req.body;
  try {
    const tokens = await loginH5(username, password, userInfo);
    res.json({ ...tokens, msg: '登录成功' });
  } catch (err) {
    sendError(res, err, 'H5登录失败');
  }
}

export async function getInfo(req, res) {
  const openid = req.user.openid;
  try {
    const user = await getUserInfo(openid);
    res.json({ msg: '获取成功', user });
  } catch (err) {
    if (isAppError(err)) {
      return res.status(err.status).json({ msg: err.message });
    }
    res.status(500).json({ msg: err.message });
  }
}

export async function refresh(req, res) {
  const refreshToken = req.body?.refreshToken || getBearerToken(req);
  try {
    const tokens = await refreshAuthTokens(refreshToken);
    res.json({ ...tokens, msg: '刷新成功' });
  } catch (err) {
    if (isAppError(err)) {
      return res.status(err.status).json({ msg: err.message });
    }
    res.status(500).json({ msg: err.message });
  }
}
