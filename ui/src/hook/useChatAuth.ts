import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  clearAuthTokens,
  get,
  getAccessToken,
  getRefreshToken,
  isJwtExpiring,
  post,
  refreshAccessToken,
  saveAuthTokens,
} from '@/utils/request';
import api from '@/utils/api';
import type { user } from '@/utils/type';
import type { AuthTokenResponse } from '@/utils/request';

const H5_LOGIN_PAYLOAD = {
  username: 'h5_test',
  password: 'pass123',
  userInfo: {
    nickName: 'H5测试用户',
    avatarUrl:
      'https://p26-passport.byteacctimg.com/img/user-avatar/a51222aa16ff2a7bb4896370ae09ea47~90x90.awebp',
  },
};

type H5LoginResponse = AuthTokenResponse & {
  user?: Partial<user>;
  data?: AuthTokenResponse & {
    user?: Partial<user>;
  };
};

type UserInfoResponse = {
  user?: Partial<user>;
};

function getQueryParam(name: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

export function useChatAuth() {
  const userInfo = ref<user>({
    openid: '',
    nickname: '',
    avatarUrl: '',
  });
  const token = ref<string>('');

  const applyQueryUserInfo = (nickname: string, avatarUrl: string) => {
    if (nickname) {
      userInfo.value.nickname = nickname;
    }
    if (avatarUrl) {
      userInfo.value.avatarUrl = avatarUrl;
    }
  };

  const loginFromH5 = async () => {
    try {
      const res = await post<H5LoginResponse>(api.h5Login, H5_LOGIN_PAYLOAD, {
        skipAuthRefresh: true,
      });
      const { accessToken } = saveAuthTokens(res);
      if (!accessToken) {
        ElMessage.error('H5登录失败，未获取到token');
        return;
      }
      token.value = accessToken;

      const responseUser = res.data?.user || res.user;
      userInfo.value.nickname = responseUser?.nickname || H5_LOGIN_PAYLOAD.userInfo.nickName;
      userInfo.value.avatarUrl = responseUser?.avatarUrl || H5_LOGIN_PAYLOAD.userInfo.avatarUrl;
      await loadUserInfo().catch(() => undefined);
    } catch (error) {
      ElMessage.error('H5登录失败');
    }
  };

  const loadUserInfo = async () => {
    const res = await get<UserInfoResponse>(api.userInfo);
    if (!res.user) return;
    userInfo.value = {
      ...userInfo.value,
      ...res.user,
    };
  };

  const restoreExistingAuth = async () => {
    let currentAccessToken = getAccessToken();
    const currentRefreshToken = getRefreshToken();
    if (!currentAccessToken && !currentRefreshToken) {
      return false;
    }

    // accessToken 缺失或临近过期时，优先用 refreshToken 静默换新，避免页面每次重新 H5 登录。
    if ((!currentAccessToken || isJwtExpiring(currentAccessToken)) && currentRefreshToken) {
      currentAccessToken = await refreshAccessToken();
    }

    if (!currentAccessToken) {
      return false;
    }

    token.value = currentAccessToken;
    await loadUserInfo();
    token.value = getAccessToken();
    return true;
  };

  onMounted(async () => {
    const accessTokenFromQuery = getQueryParam('accessToken') || getQueryParam('token');
    const refreshTokenFromQuery = getQueryParam('refreshToken');
    const nicknameFromQuery = getQueryParam('nickname');
    const avatarFromQuery = getQueryParam('avatarUrl');

    applyQueryUserInfo(nicknameFromQuery, avatarFromQuery);

    if (accessTokenFromQuery || refreshTokenFromQuery) {
      saveAuthTokens({
        accessToken: accessTokenFromQuery,
        refreshToken: refreshTokenFromQuery,
      });
    }

    try {
      if (await restoreExistingAuth()) {
        return;
      }
    } catch (error) {
      clearAuthTokens();
    }

    await loginFromH5();
  });

  return {
    userInfo,
    token,
  };
}
