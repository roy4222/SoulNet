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
  const [expandedPosts, setExpandedPosts] = useState({}); // 追蹤文章展開狀態

  // 切換文章展開狀態的函數
  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // 使用 useEffect 鉤子在組件加載時獲取分類
  useEffect(() => {
    // 定義異步函數以獲取分類
    const fetchCategories = async () => {
      try {
        // 從 Firestore 獲取 'topics' 集合的文檔
        const querySnapshot = await getDocs(collection(db, 'topics'));
        const fetchedCategories = [{ id: 'all', name: '全部' }]; // 初始化分類列表
        
        // 遍歷查詢結果，過濾掉 'other' 分類
        querySnapshot.forEach((doc) => {
          // 如果不是 'other' 分類，則添加到列表中
          if (doc.id !== 'other') {
            fetchedCategories.push({
              id: doc.id,
              name: doc.data().name
            });
          }
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
      setIsLoadingPosts(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'posts'));
        const fetchedPosts = [];
        
        querySnapshot.forEach((doc) => {
          const postData = doc.data();
          // 修正舊的圖片URL格式
          let imageUrl = postData.imageUrl;
          console.log('原始imageUrl:', imageUrl);
          
          if (imageUrl) {
            // 從URL中提取文件名
            let fileName;
            if (imageUrl.includes('cloudflarestorage.com')) {
              const urlParts = imageUrl.split('/');
              fileName = urlParts[urlParts.length - 1];
              // 如果文件名前面是soulnet,需要去掉
              if (fileName === 'soulnet') {
                fileName = urlParts[urlParts.length - 1];
              }
              const endpoint = import.meta.env.VITE_R2_ENDPOINT;
              imageUrl = `https://${endpoint}/${fileName}`;
              console.log('修正後imageUrl:', imageUrl);
            }
          }
          
          // 確保作者資訊被正確保存
          const author = postData.author || {
            displayName: '匿名用戶',
            photoURL: null,
            uid: null,
            email: null
          };
          
          fetchedPosts.push({
            id: doc.id,
            ...postData,
            imageUrl,
            author  // 確保作者資訊被正確保存
          });
        });
        
        // 按創建時間降序排序
        fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
        console.log('所有文章:', fetchedPosts);
        
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []); // 空依賴數組意味著這個效果只在組件掛載時運行一次

  // 根據選中的分類過濾文章
  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'all') return true;
    // 同時支援新舊格式的分類字段
    return post.category === selectedCategory || post.topic === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* 使用條件式 grid 布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 lg:gap-8">
          {/* 分類導航 - 在手機版時水平滾動 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 lg:h-fit order-2 lg:order-1"
          >
            <h2 className="text-lg font-semibold mb-4 px-2 lg:block hidden text-gray-900 dark:text-white">文章分類</h2>
            {/* 分類導航 - 在手機版時水平滾動，在桌面版時垂直排列 */}
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 lg:mx-0 px-4 lg:px-0">
              {isLoading ? (
                // 加載中顯示旋轉動畫
                <div className="flex justify-center">
                  <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S16.627 6 12 6z"></path>
                  </svg>
                </div>
              ) : (
                categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-left transition-all whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4">
                歡迎來到SoulNet
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300">
                連結靈魂，共創精彩，分享生活的每一刻
              </p>
            </motion.div>

            {/* 文章列表區域 */}
            <div className="grid gap-4 sm:gap-6">
              {isLoadingPosts ? (
                <div className="flex justify-center">
                  <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
                    className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md"
                  >
                    {/* 文章標題和作者資訊 */}
                    <div className="flex items-center gap-3 mb-4">
                      {/* 作者頭像 */}
                      <img 
                        src={post.author?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                        alt={post.author?.displayName || '匿名用戶'} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        {/* 作者名稱或郵箱 */}
                        <h3 className="font-medium text-gray-900 dark:text-white">{post.author?.email || post.author?.displayName || '匿名用戶'}</h3>
                        {/* 發文時間 */}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {post.createdAt?.toDate().toLocaleString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* 文章標題 */}
                    <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-white">{post.title}</h2>

                    {/* 文章圖片 */}
                    {post.imageUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-auto max-h-96 object-cover transform hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.error('圖片載入失敗:', post.imageUrl);
                            e.target.src = '/placeholder.png';
                            e.target.onerror = null;
                          }}
                        />
                      </div>
                    )}

                    {/* 文章分類 */}
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {categories.find(c => c.id === (post.topic || post.category))?.name || '未分類'}
                      </span>
                    </div>

                    {/* 文章內容 */}
                    <div className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">
                      {post.content.length > 150 ? (
                        <>
                          {/* 使用 pre 標籤來保留文本格式，同時應用自定義樣式 */}
                          <pre className="whitespace-pre-wrap break-words font-sans">
                            {/* 根據展開狀態顯示全文或截斷的內容 */}
                            {expandedPosts[post.id] ? post.content : `${post.content.slice(0, 150)}...`}
                          </pre>
                          {/* 切換展開/收起的按鈕 */}
                          <button
                            onClick={() => togglePostExpansion(post.id)}
                            className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            {/* 根據展開狀態顯示不同的按鈕文字 */}
                            {expandedPosts[post.id] ? '' : '顯示更多'}
                          </button>
                        </>
                      ) : (
                        // 如果內容少於150字符，直接顯示全文
                        <pre className="whitespace-pre-wrap break-words font-sans">{post.content}</pre>
                      )}
                    </div>

                    {/* 互動按鈕 */}
                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>讚</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>留言</span>
                      </button>
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