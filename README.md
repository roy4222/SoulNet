# SoulNet

現代化社交平台，整合文章分享、分類瀏覽與用戶互動功能。這個平台旨在提供一個全面的社交體驗，讓用戶能夠輕鬆發布和閱讀各類文章，通過直觀的分類系統快速找到感興趣的內容，並通過點讚、評論等方式與其他用戶互動。平台的設計注重用戶體驗，採用響應式佈局，確保在各種設備上都能提供流暢的瀏覽體驗。

## 功能特性

### 用戶系統
- **Firebase 身份驗證**：安全可靠的用戶註冊與登入系統
- **個人資料管理**：用戶可以自定義頭像和個人信息
- **本地狀態持久化**：使用 localStorage 保存登入狀態

### 文章系統
- **文章發布**：支持富文本編輯和圖片上傳
- **分類管理**：文章分類系統，支持多分類瀏覽
- **互動功能**：
  - 喜歡：使用心形圖標,支持點擊動畫
  - 評論：優化的評論區設計,支持取消編輯
  - 分享：一鍵複製文章連結
  - 轉發：支持文章轉發功能

### 界面設計
- **響應式設計**：完美適配桌面和移動設備
- **深色模式**：支持淺色/深色主題切換
- **動態過渡**：使用 Framer Motion 實現流暢動畫
- **現代化 UI**：
  - Threads 風格的互動按鈕
  - 漸變色按鈕
  - 優化的評論區佈局
  - 圓角設計和陰影效果

### 用戶體驗
- **即時反饋**：
  - 按鈕點擊動畫效果
  - 評論發布後的過渡動畫
  - 操作提示信息
- **狀態保持**：記住用戶的主題偏好設置
- **無縫導航**：使用 React Router 實現流暢頁面切換
- **評論體驗**：
  - 支持取消編輯
  - 美觀的評論卡片設計
  - 優先顯示用戶郵箱
  - 評論時間本地化顯示

### 技術棧

### 前端框架
- **React 18**：使用最新的 React 特性
- **Vite**：快速的開發環境和構建工具
- **React Router v6**：聲明式路由管理

### 樣式與動畫
- **Tailwind CSS**：原子化 CSS 框架
- **Material UI**：
  - 優質的圖標系統
  - 表單組件
  - 按鈕組件
- **Framer Motion**：
  - 頁面切換動畫
  - 評論列表動畫
  - 按鈕互動效果

### 狀態管理
- **React Context**：管理全局主題狀態
- **Local Storage**：持久化用戶數據
- **Custom Hooks**：封裝可重用的業務邏輯

### 後端服務
- **Firebase Auth**：處理用戶認證
- **Firebase Storage**：存儲用戶上傳的圖片
- **Firebase Firestore**：
  - 文章數據存儲
  - 評論內嵌存儲
  - 用戶互動數據追蹤

### 開發工具
- **ESLint**：代碼質量控制
- **Prettier**：代碼格式化
- **Git**：版本控制

## 專案結構

```
social/
├── src/
│   ├── components/        # 可重用組件
│   ├── pages/            
│   │   ├── HomePage.jsx  # 首頁
│   │   ├── NewPost.jsx   # 發文頁面
│   │   ├── Post.jsx      # 文章詳情頁面
│   │   │   - 文章展示
│   │   │   - 互動功能
│   │   │   - 評論系統
│   │   ├── Sign.jsx      # 登入頁面
│   │   └── Register.jsx  # 註冊頁面
│   ├── contexts/         # Context 相關
│   │   └── themeContext.jsx # 主題 Context
│   ├── utils/            # 工具函數
│   │   └── firebase.js   # Firebase 配置
│   ├── routes.js         # 路由配置
│   └── main.jsx          # 入口文件
├── public/               # 靜態資源
└── package.json          # 項目配置
```

## 安裝與運行

```bash
# 克隆倉庫
git clone https://github.com/yourusername/social-platform.git

# 安裝依賴
npm install

# 開發模式
npm run dev

# 生產構建
npm run build
```

## 環境變量配置

創建 `.env` 文件並配置以下環境變量：

```env
VITE_FIREBASE_API_KEY=你的_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=你的_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=你的_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=你的_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=你的_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=你的_APP_ID
```

## 開發計劃

- [ ] 添加文章搜索功能
- [ ] 實現用戶關注系統
- [ ] 添加即時通知功能
- [ ] 優化圖片上傳體驗
- [ ] 添加社交媒體分享功能

## 貢獻指南

1. Fork 本倉庫
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '添加一些特性'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權協議

本項目採用 MIT 授權協議 - 查看 [LICENSE](LICENSE) 文件了解更多細節.