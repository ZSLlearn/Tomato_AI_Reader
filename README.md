# Tomato Reader 🍅

AI 智能阅读器 — 一款基于 Electron 的桌面端多格式文档阅读工具，专为大学生期末复习场景设计。

## 为什么选择 Tomato Reader？

期末临近，课件堆积如山 —— PDF 讲义、PPT 课件、Word 复习提纲、EPUB 电子教材……格式五花八门，翻来翻去效率极低。

Tomato Reader 帮你：

- **一个软件通吃**：PDF / DOCX / PPTX / EPUB / TXT 全部原生打开，不用装 Office 不用装各种阅读器
- **AI 帮你读**：选中不懂的段落，一键让 AI 解释或翻译；有什么想问的，直接对话，AI 结合全文回答
- **整理不费力**：导入课件后按科目建书架（"高数"、"线代"、"大物"），拖拽归类，一目了然
- **查资料飞快**：同时打开多份课件，标签页切换，配合搜索秒找知识点

**简单说：把散落各处的期末课件装进一个软件，边看边问 AI，复习效率翻倍。**

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（浏览器）
npm start

# 开发模式（Electron 桌面窗口）
npm run electron
```

> 浏览器访问 http://localhost:8088 即可体验。

## 构建

```bash
# Windows 便携版
npm run build:win

# Windows 安装包
npm run build:win:installer
```

## 主要功能

| 功能 | 说明 |
|------|------|
| 多格式阅读 | PDF、DOCX、PPTX、EPUB、TXT 原生预览 |
| 书架管理 | 按科目建书架，文档分类存放 |
| 多标签页 | 同时打开多份课件，快速切换 |
| 缩放翻页 | 放大缩小、适合宽度、单双页模式 |
| 暗色模式 | 夜间复习不刺眼 |
| AI 解释 | 选中文字，悬浮窗一键解释 |
| AI 翻译 | 选中文字，悬浮窗一键翻译（中英互译） |
| AI 对话 | 右侧面板与 AI 深度讨论，结合全文回答 |
| 引用收集 | 阅读时收集关键段落，统一提问 |

## 配置 AI

1. 打开软件 → 右上角设置 → 「AI 服务」标签
2. 添加配置，填入 DeepSeek API Key
3. 点击「测试连接」，通过后保存

> API Key 获取：https://platform.deepseek.com/api_keys

## 技术栈

Electron 34 · PDF.js · mammoth.js · DeepSeek API · IndexedDB

## 项目结构

```
TomatoReader/
├── main.js          # Electron 主进程
├── preload.js       # 预加载脚本（contextBridge）
├── app.js           # 前端主逻辑
├── ai-service.js    # AI 服务层（API 通信/提示词/Token 管理）
├── storage.js       # 数据持久化（localStorage + IndexedDB）
├── server.js        # 开发服务器
├── index.html       # 主页面
├── style.css        # 样式
├── build/           # 第三方库（PDF.js、mammoth.js、JSZip）
└── web/             # 图标、图片、字体映射等静态资源
```
