import swaggerJsdoc from 'swagger-jsdoc';

const serverUrl =
  process.env.SWAGGER_SERVER_URL ||
  `http://localhost:${process.env.PORT || 3000}`;

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Wechat AI Backend API',
    version: '1.0.0',
    description:
      '微信小程序 AI 服务后端接口文档。包含用户鉴权、AI 会话、语音转写等能力。',
  },
  servers: [
    {
      url: serverUrl,
      description: '当前环境',
    },
  ],
  tags: [
    { name: 'User', description: '用户鉴权与信息接口' },
    { name: 'AI', description: 'AI 聊天与模型接口' },
    { name: 'Session', description: '会话与消息管理接口' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./docs/swagger/*.js'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
