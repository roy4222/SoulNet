// 引入必要的組件和函數
import Header from "./components/Header";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import routes from './routes';
import Footer from "./components/Footer";
import { ThemeProvider } from './contexts/themeContext';

// 定義 App 組件
function App() {
  return (
    // 使用 ThemeProvider 包裹整個應用
    <ThemeProvider>
      {/* 使用 Router 包裹整個應用 */}
      <Router>
        {/* 創建一個最小高度為螢幕高度的 flex 容器 */}
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {/* 顯示頁面頭部 */}
          <Header />
          {/* 主要內容區域，使用 flex-grow 使其填滿剩餘空間 */}
          <main className="flex-grow pt-20">
            {/* 路由配置 */}
            <Routes>
              {/* 遍歷路由配置，動態生成 Route 組件 */}
              {routes.map(({ path, element: Element }) => (
                <Route key={path} path={path} element={<Element />} />
              ))}
            </Routes>
          </main>
          {/* 顯示頁面底部 */}
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

// 導出 App 組件
export default App;
