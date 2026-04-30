import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import {
  upsertWeChatUser,
  getUserByOpenid,
  getUserByUsername,
  createH5User,
  updateLastLogin,
  updateProfileIfProvided,
} from '../repositories/userRepository.js';
import { createPasswordHash, verifyPassword } from '../utils/password.js';
import { AppError } from '../errors/AppError.js';

const H5_OPENID_PREFIX = 'h5:';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

function signToken(openid, type, expiresIn) {
  return jwt.sign({ openid, type }, config.jwtSecret, { expiresIn });
}

function issueAuthTokens(openid) {
  const accessToken = signToken(openid, 'access', ACCESS_TOKEN_EXPIRES_IN);
  const refreshToken = signToken(openid, 'refresh', REFRESH_TOKEN_EXPIRES_IN);
  return {
    accessToken,
    refreshToken,
    token: accessToken,
  };
}

function normalizeUsername(username) {
  return String(username || '').trim();
}

function buildH5Openid(username) {
  return `${H5_OPENID_PREFIX}${username}`;
}

export async function loginMiniProgram(code, userInfo) {
  if (!code) {
    throw new AppError('code不能为空', 400);
  }

  const response = await axios.get(
    'https://api.weixin.qq.com/sns/jscode2session',
    {
      params: {
        appid: config.wxAppId,
        secret: config.wxAppSecret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    }
  );

  const data = response.data;
  if (data.errcode) {
    throw new AppError('微信接口返回错误', 400, data);
  }

  const openid = data.openid;
  if (!openid) {
    throw new AppError('未获取到openid', 400);
  }

  await upsertWeChatUser(openid, userInfo);
  return issueAuthTokens(openid);
}

export async function loginH5(username, password, userInfo) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    throw new AppError('username不能为空', 400);
  }
  if (!password) {
    throw new AppError('password不能为空', 400);
  }

  const existing = await getUserByUsername(normalizedUsername);
  if (existing) {
    if (!existing.passwordHash) {
      throw new AppError('账号未设置密码', 400);
    }
    if (!verifyPassword(password, existing.passwordHash)) {
      throw new AppError('账号或密码错误', 401);
    }

    if (userInfo?.nickName || userInfo?.avatarUrl) {
      await updateProfileIfProvided(existing.openid, userInfo);
    } else {
      await updateLastLogin(existing.openid);
    }

    return issueAuthTokens(existing.openid);
  }

  const openid = buildH5Openid(normalizedUsername);
  const passwordHash = createPasswordHash(password);
  await createH5User(openid, normalizedUsername, passwordHash, userInfo);
  return issueAuthTokens(openid);
}

export async function getUserInfo(openid) {
  const row = await getUserByOpenid(openid);
  if (!row) {
    throw new AppError('用户不存在', 404);
  }
  const { passwordHash, ...safeUser } = row;
  return safeUser;
}

export async function refreshAuthTokens(refreshTokenValue) {
  if (!refreshTokenValue) {
    throw new AppError('refreshToken不能为空', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenValue, config.jwtSecret);
  } catch (err) {
    throw new AppError('refreshToken 无效或已过期', 401);
  }

  if (!decoded?.openid || decoded.type !== 'refresh') {
    throw new AppError('refreshToken 类型错误', 401);
  }

  const user = await getUserByOpenid(decoded.openid);
  if (!user) {
    throw new AppError('用户不存在，请重新登录', 401);
  }

  return issueAuthTokens(decoded.openid);
}
