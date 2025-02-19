import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

// 定義HomePage組件
function HomePage() {
  // 定義狀態變數
  const [selectedCategory, setSelectedCategory] = useState('all'); // 當前選中的分類
  const [categories, setCategories] = useState([
    { id: 'all', name: '全部' }
  ]); // 分類列表，初始化為全部
  const [isLoading, setIsLoading] = useState(true); // 加載狀態
  const [posts, setPosts] = useState([]); // 文章列表，初始化為空數組
  const [isLoadingPosts, setIsLoadingPosts] = useState(true); // 文章加載狀態

  // 使用 useEffect 鉤子在組件加載時獲取分類
  useEffect(() => {
    // 定義異步函數以獲取分類
    const fetchCategories = async () => {
      try {
        // 從 Firestore 獲取 'topics' 集合的文檔
        const querySnapshot = await getDocs(collection(db, 'topics'));
        const fetchedCategories = [{ id: 'all', name: '全部' }]; // 初始化分類列表
        
        // 遍歷查詢結果，將每個分類添加到列表中
        querySnapshot.forEach((doc) => {
          fetchedCategories.push({
            id: doc.id,
            name: doc.data().name
          });
        });
        
        // 更新狀態
        setCategories(fetchedCategories);
        setIsLoading(false); // 設置加載完成
      } catch (error) {
        console.error('Error fetching categories:', error);
        setIsLoading(false); // 即使出錯也設置加載完成
      }
    };

    fetchCategories(); // 調用函數
  }, []); // 空依賴數組意味著這個效果只在組件掛載時運行一次

  // 使用 useEffect 鉤子在組件加載時獲取文章
  useEffect(() => {
    // 定義異步函數 fetchPosts 用於獲取文章數據
    const fetchPosts = async () => {
      try {
        // 設置加載狀態為 true
        setIsLoadingPosts(true);
        // 從 Firestore 獲取 'posts' 集合的所有文檔
        const querySnapshot = await getDocs(collection(db, 'posts'));
        const fetchedPosts = [];
        
        // 遍歷查詢結果，將每篇文章的數據添加到 fetchedPosts 數組中
        querySnapshot.forEach((doc) => {
          const postData = doc.data();
          fetchedPosts.push({
            id: doc.id, // 添加文檔 ID 作為文章 ID
            ...postData // 展開文章的其他數據
          });
        });
        
        // 更新 posts 狀態，將獲取的文章數據設置到狀態中
        setPosts(fetchedPosts);
      } catch (error) {
        // 如果發生錯誤，在控制台輸出錯誤信息
        console.error('Error fetching posts:', error);
      } finally {
        // 無論成功與否，最後都將加載狀態設置為 false
        setIsLoadingPosts(false);
      }
    };

    // 調用 fetchPosts 函數
    fetchPosts();
  }, []); // 空依賴數組意味著這個效果只在組件掛載時運行一次

  // 根據分類過濾文章
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* 使用條件式 grid 布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 lg:gap-8">
          {/* 分類導航 - 在手機版時水平滾動 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-4 lg:h-fit order-2 lg:order-1"
          >
            <h2 className="text-lg font-semibold mb-4 px-2 lg:block hidden">文章分類</h2>
            {/* 分類導航 - 在手機版時水平滾動，在桌面版時垂直排列 */}
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 lg:mx-0 px-4 lg:px-0">
              {isLoading ? (
                // 加載中顯示旋轉動畫
                <div className="flex justify-center">
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S16.627 6 12 6z"></path>
                  </svg>
                </div>
              ) : (
                // 分類按鈕列表
                categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-left transition-all whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                      // 根據選中狀態設置不同的樣式
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))
              )}
            </nav>
          </motion.div>

          {/* 右側內容區 */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* 歡迎區塊 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-4 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                歡迎來到SoulNet
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600">
                連結靈魂，共創精彩，分享生活的每一刻
              </p>
            </motion.div>

            {/* 文章列表區域 */}
            <div className="grid gap-4 sm:gap-6">
              {isLoadingPosts ? (
                <div className="flex justify-center">
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S16.627 6 12 6z"></path>
                  </svg>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <motion.article
                    key={post.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white p-4 sm:p-6 rounded-xl shadow-md"
                  >
                    {/* 文章標題 */}
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">{post.title}</h2>
                    {/* 文章分類和日期 */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-4">
                      {/* 分類標籤 */}
                      <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                        {categories.find(c => c.id === post.category)?.name}
                      </span>
                      {/* 發布日期 */}
                      <span className="text-sm text-gray-500">{post.date}</span>
                    </div>
                    {/* 文章內容 */}
                    <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">{post.content}</p>
                    {/* 點讚和留言數量 */}
                    <div className="flex items-center justify-between text-gray-500 text-sm sm:text-base">
                      {/* 點讚數量 */}
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{post.likes} 個讚</span>
                      </div>
                      {/* 留言數量 */}
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>{post.comments} 則留言</span>
                      </div>
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;