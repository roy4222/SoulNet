# ScrollToTopButton 組件使用指南

## 概述

`ScrollToTopButton` 是一個可重用的組件，提供「回到頂部」功能。當用戶滾動頁面超過一定距離時，按鈕會自動顯示，點擊後頁面會平滑滾動回頂部。

## 特點

- 自動顯示/隱藏：當頁面滾動超過 300px 時才顯示按鈕
- 平滑滾動：使用 `smooth` 滾動行為提供良好的用戶體驗
- 可自定義點擊行為：可以傳入自定義的 `onClick` 函數
- 美觀的 UI：使用漸變背景和動畫效果

## 如何使用

### 基本用法

只需在您的頁面組件中導入並使用 `ScrollToTopButton` 組件：

```jsx
import React from 'react';
import ScrollToTopButton from '../components/ScrollToTopButton';

function YourPage() {
  return (
    <div>
      {/* 您的頁面內容 */}
      
      {/* 添加回到頂部按鈕 */}
      <ScrollToTopButton />
    </div>
  );
}

export default YourPage;
```

### 自定義點擊行為

如果您需要在點擊按鈕時執行自定義邏輯，可以傳入 `onClick` 屬性：

```jsx
import React from 'react';
import ScrollToTopButton from '../components/ScrollToTopButton';

function YourPage() {
  // 自定義的回到頂部函數
  const customScrollToTop = () => {
    // 執行您的自定義邏輯
    console.log('自定義回到頂部邏輯');
    
    // 然後滾動到頂部
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div>
      {/* 您的頁面內容 */}
      
      {/* 使用自定義點擊行為 */}
      <ScrollToTopButton onClick={customScrollToTop} />
    </div>
  );
}

export default YourPage;
```

## 組件原理

1. 使用 `useState` 和 `useEffect` 鉤子監聽頁面滾動事件
2. 當頁面滾動超過 300px 時，設置 `isVisible` 為 `true`
3. 使用 Framer Motion 提供平滑的顯示/隱藏動畫
4. 點擊按鈕時，執行自定義的 `onClick` 函數或默認的回到頂部函數

## 注意事項

- 組件已經處理了事件監聽器的清理，避免內存洩漏
- 按鈕位置固定在右下角，使用 `z-index: 50` 確保在其他元素之上
- 提供了無障礙支持，包括 `aria-label` 屬性
