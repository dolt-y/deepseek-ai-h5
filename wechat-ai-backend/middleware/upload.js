import multer from 'multer';

// 配置文件上传中间件
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 暴露upload中间件供路由使用
export { upload };