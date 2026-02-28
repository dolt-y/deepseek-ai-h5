import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { post } from '@/utils/request';
import api from '@/utils/api';
import type { user } from '@/utils/type';

const H5_LOGIN_PAYLOAD = {
  username: 'h5_test',
  password: 'pass123',
  userInfo: {
    nickName: 'H5测试用户',
    avatarUrl: 'https://p26-passport.byteacctimg.com/img/user-avatar/a51222aa16ff2a7bb4896370ae09ea47~90x90.awebp'
  }
};

type H5LoginResponse = {
  token?: string;
  access_token?: string;
  data?: {
    token?: string;
    access_token?: string;
    user?: Partial<user>;
  };
  user?: Partial<user>;
};

function getQueryParam(name: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

function pickLoginToken(res?: H5LoginResponse) {
  return (
    res?.token
  );
}

export function useChatAuth() {
  const userInfo = ref<user>({
    openid: '',
    nickname: '',
    avatarUrl: ''
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
      const res = await post<H5LoginResponse>(api.h5Login, H5_LOGIN_PAYLOAD);
      const loginToken = pickLoginToken(res);
      if (!loginToken) {
        ElMessage.error('H5登录失败，未获取到token');
        return;
      }
      token.value = loginToken;
      localStorage.setItem('token', loginToken);
      userInfo.value.nickname=H5_LOGIN_PAYLOAD.userInfo.nickName;
      userInfo.value.avatarUrl=H5_LOGIN_PAYLOAD.userInfo.avatarUrl;
    } catch (error) {
      ElMessage.error('H5登录失败');
    }
  };

  onMounted(async () => {
    const tokenFromQuery = getQueryParam('token');
    const nicknameFromQuery = getQueryParam('nickname');
    const avatarFromQuery = getQueryParam('avatarUrl');

    applyQueryUserInfo(nicknameFromQuery, avatarFromQuery);

    if (tokenFromQuery) {
      token.value = tokenFromQuery;
      localStorage.setItem('token', tokenFromQuery);
      return;
    }

    await loginFromH5();
  });

  return {
    userInfo,
    token
  };
}
