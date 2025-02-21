// 引入必要的 React hooks
import { createContext, useContext, useState, useEffect } from 'react';

// 創建一個新的 Context 用於主題管理
const ThemeContext = createContext();

// ThemeProvider 組件，用於包裹整個應用並提供主題相關的狀態和方法
export const ThemeProvider = ({ children }) => {
  // 使用 useState 來管理暗黑模式狀態，初始值通過函數動態決定
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 優先檢查 localStorage 中保存的主題
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // 如果沒有保存的主題，則檢查系統偏好設置
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 使用 useEffect 來監聽 isDarkMode 的變化並應用相應的主題
  useEffect(() => {
    if (isDarkMode) {
      // 如果是暗黑模式，添加 'dark' 類到 html 元素
      document.documentElement.classList.add('dark');
      // 將主題偏好保存到 localStorage
      localStorage.setItem('theme', 'dark');
    } else {
      // 如果不是暗黑模式，移除 'dark' 類
      document.documentElement.classList.remove('dark');
      // 將主題偏好保存到 localStorage
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]); // 依賴項為 isDarkMode，當它變化時執行效果

  // 切換主題的函數
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // 返回 ThemeContext.Provider，向子組件提供主題相關的狀態和方法
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定義 hook，用於在其他組件中方便地獲取和使用主題相關的狀態和方法
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // 如果在 ThemeProvider 外使用 useTheme，拋出錯誤
    throw new Error('useTheme 必須在 ThemeProvider 內使用');
  }
  return context;
};
