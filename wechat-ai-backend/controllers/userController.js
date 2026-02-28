import { loginMiniProgram, loginH5, getUserInfo, refreshToken } from '../services/userService.js';
import { sendError } from '../utils/error.js';
import { isAppError } from '../errors/AppError.js';

export async function login(req, res) {
  const { code, userInfo } = req.body;
  try {
    const { token } = await loginMiniProgram(code, userInfo);
    res.json({ token, msg: '登录成功' });
  } catch (err) {
    sendError(res, err, '微信接口调用失败');
  }
}

export async function loginH5Controller(req, res) {
  const { username, password, userInfo } = req.body;
  try {
    const { token } = await loginH5(username, password, userInfo);
    res.json({ token, msg: '登录成功' });
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

export function refresh(req, res) {
  const { token } = refreshToken(req.user.openid);
  res.json({ token, msg: '刷新成功' });
}
