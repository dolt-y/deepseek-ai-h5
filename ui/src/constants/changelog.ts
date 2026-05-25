export type ChangelogItem = {
  version: string;
  date: string;
  items: string[];
};

export const CHANGELOG: ChangelogItem[] = [
  {
    version: 'v1.0.1',
    date: '2026-05-25',
    items: [
      '修复 Markdown 长文本复制时内容被截断的问题',
    ],
  },
];

export const USAGE_TIPS = [
  '底部工具栏支持新建会话、上传图片及查看历史记录',
  '输入框左侧可切换模型；麦克风按钮用于语音输入（线上环境暂未开放，需自行配置域名与模型）',
  '长按或点击助手消息，可进行点赞、复制或重新生成',
  '该网站预计将于 2026 年 6 月停止服务。本项目仅作为个人求职作品集展示，届时相关数据将统一清空，敬请谅解',
];
