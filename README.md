# 社交平台

具有身份驗證流程和響應式UI的現代網絡應用

## 核心功能

- 身份驗證系統（登入/註冊）
- React Router 導航
- 基於組件的架構：
  - 頁首/頁尾組件
  - 頁面組件（首頁、登入、註冊）
  - 路由配置系統

## 技術棧

- React 19 + Vite
- React Router v7
- TailwindCSS + PostCSS
- Firebase v11（數據庫/後端）
- Framer Motion v12（動畫）
- ESLint + Prettier

## 專案結構
```
src/
├── components/      # 可重用組件
│   ├── Header.jsx
│   └── Footer.jsx
├── pages/           # 頁面組件
│   ├── HomePage.jsx
│   ├── Sign.jsx
│   └── Register.jsx
├── routes.js        # 路由配置
└── App.jsx          # 根組件
```

## 開發設置
```bash
npm install
npm run dev
```

## 構建命令
```bash
npm run build  # 生產環境構建
npm run preview  # 本地預覽
```
