export const userDocs = {};

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         nickName:
 *           type: string
 *           example: Codex
 *         avatarUrl:
 *           type: string
 *           example: https://example.com/avatar.png
 *     LoginRequest:
 *       type: object
 *       required:
 *         - code
 *       properties:
 *         code:
 *           type: string
 *           description: wx.login 返回的临时 code
 *         userInfo:
 *           $ref: '#/components/schemas/UserProfile'
 *     H5LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: H5 登录账号
 *         password:
 *           type: string
 *           description: H5 登录密码
 *         userInfo:
 *           $ref: '#/components/schemas/UserProfile'
 *     TokenResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: 短期访问令牌，用于业务接口 Authorization Bearer
 *         refreshToken:
 *           type: string
 *           description: 长期刷新令牌，仅用于 /api/user/refresh
 *         token:
 *           type: string
 *           description: accessToken 的兼容别名
 *         msg:
 *           type: string
 *           example: 登录成功
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: 登录接口返回的 refreshToken
 *     UserInfo:
 *       type: object
 *       properties:
 *         openid:
 *           type: string
 *         username:
 *           type: string
 *         nickname:
 *           type: string
 *         avatarUrl:
 *           type: string
 *         model:
 *           type: string
 *           example: deepseek-v4-flash
 *         lastLogin:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [User]
 *     summary: 微信登录并创建/更新用户信息
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: 参数错误或微信接口返回错误
 *       500:
 *         description: 服务器内部错误
 */

/**
 * @swagger
 * /api/user/login/h5:
 *   post:
 *     tags: [User]
 *     summary: H5 账号密码登录（不存在则自动注册）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/H5LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: 参数错误或微信接口返回错误
 *       500:
 *         description: 服务器内部错误
 */

/**
 * @swagger
 * /api/user/info:
 *   get:
 *     tags: [User]
 *     summary: 获取当前登录用户信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 获取成功
 *                 user:
 *                   $ref: '#/components/schemas/UserInfo'
 *       401:
 *         description: 未认证或 token 失效
 *       404:
 *         description: 用户不存在
 */

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     tags: [User]
 *     summary: 使用 refreshToken 静默刷新 accessToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: 未认证或 token 失效
 */
