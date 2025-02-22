import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Fab } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Link, useNavigate } from 'react-router-dom';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // 控制圖片 modal 的開關狀態
  const [selectedImage, setSelectedImage] = useState(null); // 當前選中的圖片 URL
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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

  // 回到頂部函數
  const scrollToTop = () => {
    window.scrollTo({  //是瀏覽器內建的滾動方法，用來控制頁面的滾動位置
      top: 0,
      behavior: 'smooth'
    });
  };

  // 導航到貼文最上方的函數
  const navigateToPost = (postId) => {
    // 將頁面滾動到頂部
    window.scrollTo(0, 0);
    // 使用 React Router 的 navigate 函數跳轉到指定的貼文頁面
    navigate(`/post/${postId}`);
  };

  const handleLike = async (post) => {
    if (!currentUser) {
      navigate('/sign');
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    if (post.likes?.includes(currentUser?.uid)) {
      await updateDoc(postRef, {
        likes: arrayRemove(currentUser?.uid)
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(currentUser?.uid)
      });
    }
  };

  const handleRepost = async (post) => {
    if (!currentUser) {
      navigate('/sign');
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    if (post.reposts?.includes(currentUser?.uid)) {
      await updateDoc(postRef, {
        reposts: arrayRemove(currentUser?.uid)
      });
    } else {
      await updateDoc(postRef, {
        reposts: arrayUnion(currentUser?.uid)
      });
    }
  };

  const handleShare = async (post) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      alert('連結已複製到剪貼簿！');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* 使用條件式 grid 布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 lg:gap-8">
          {/* 分類導航 - 在手機版時水平滾動，在桌面版時固定在左側 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 order-2 lg:order-1 lg:sticky lg:top-[8rem] lg:w-[240px] lg:max-h-[calc(80vh-5rem)] lg:overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
            }}
          >
            <h2 className="text-lg font-semibold mb-4 px-2 lg:block hidden text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-800 z-10 py-2">文章分類</h2>
            {/* 分類導航 - 在手機版時水平滾動，在桌面版時垂直排列 */}
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 lg:mx-0 px-4 lg:px-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
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

          {/* 右側內容區 - 添加左側 margin 以避免被固定導航遮擋 */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2 lg:col-start-2">
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
                  <Link 
                    to={`/post/${post.id}`}
                    key={post.id}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <motion.article 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4 cursor-pointer relative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
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

                      {/* 文章內容區塊 */}
                      <div className="mb-4">
                        {/* 顯示文章內容，根據展開狀態決定是否顯示全文 */}
                        <p className="text-gray-800 dark:text-gray-200">
                          {/* 如果文章已展開，顯示全文；否則只顯示前100個字符並加上省略號 */}
                          {expandedPosts[post.id] ? post.content : `${post.content.slice(0, 100)}`}
                        </p>
                        {/* 當文章內容超過100個字符時，顯示"顯示更多"按鈕 */}
                        {post.content.length > 100 && (
                          <button
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
                            onClick={(e) => {
                              e.preventDefault(); // 防止事件冒泡到父元素
                              e.stopPropagation(); // 停止事件傳播
                              togglePostExpansion(post.id); // 切換文章展開狀態
                            }}
                          >
                            {/* 根據當前展開狀態顯示不同的按鈕文字 */}
                            {expandedPosts[post.id] ? '' : '顯示更多'}
                          </button>
                        )}
                      </div>

                      {/* 文章圖片 */}
                      {post.imageUrl && (
                        <div className="mb-4 rounded-lg overflow-hidden transition-shadow duration-300">
                          <div className="aspect-w-4 aspect-h-3 max-w-2xl mx-auto">
                            <img 
                              src={post.imageUrl} 
                              alt={post.title}
                              className="w-full h-full object-cover transform hover:scale-[1.02] transition-transform duration-300 rounded-lg cursor-pointer"
                              onClick={() => {
                                setSelectedImage(post.imageUrl);
                                setIsImageModalOpen(true);
                              }}
                              onError={(e) => {
                                console.error('圖片載入失敗:', post.imageUrl);
                                e.target.src = '/placeholder.png';
                                e.target.onerror = null;
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 文章分類 */}
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {categories.find(c => c.id === (post.topic || post.category))?.name || '未分類'}
                        </span>
                      </div>

                      {/* 互動按鈕 */}
                      <div 
                        className="flex items-center gap-4 text-gray-500 dark:text-gray-400 interaction-buttons"
                        onClick={e => e.preventDefault()}
                      >
                        {/* 點讚按鈕 */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLike(post);
                          }}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group"
                        >
                          {post.likes?.includes(currentUser?.uid) 
                            ? <FavoriteRoundedIcon className="w-6 h-6 text-red-500" />
                            : <FavoriteBorderRoundedIcon className="w-6 h-6 group-hover:text-red-500" />
                          }
                          <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                        </button>

                        {/* 評論按鈕 */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/post/${post.id}#comments`);
                          }}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="group-hover:text-blue-500">
                            <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12a9.9 9.9 0 0 0 2.26 6.33l-2 2a1 1 0 0 0-.21 1.09A1 1 0 0 0 3 22h9a10 10 0 0 0 0-20m0 18H5.41l.93-.93a1 1 0 0 0 0-1.41A8 8 0 1 1 12 20"/>
                          </svg>
                          <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                        </button>

                        {/* 轉發按鈕 */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRepost(post);
                          }}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21 21" className="group-hover:text-green-500">
                            <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m13.5 13.5l3 3l3-3"/>
                              <path d="M9.5 4.5h3a4 4 0 0 1 4 4v8m-9-9l-3-3l-3 3"/>
                              <path d="M11.5 16.5h-3a4 4 0 0 1-4-4v-8"/>
                            </g>
                          </svg>
                          <span className="text-sm font-medium">{post.reposts?.length || 0}</span>
                        </button>

                        {/* 分享按鈕 */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShare(post);
                          }}
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="group-hover:text-blue-500">
                            <path fill="currentColor" d="M13 14h-2a9 9 0 0 0-7.968 4.81A10 10 0 0 1 3 18C3 12.477 7.477 8 13 8V3l10 8l-10 8z"/>
                          </svg>
                          <span className="text-sm font-medium">{post.shares || 0}</span>
                        </button>
                      </div>
                    </motion.article>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 圖片放大 Modal */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }}
        >
          <img 
            src={selectedImage} 
            alt="放大圖片"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()} // 防止點擊圖片時關閉 modal
          />
        </div>
      )}
      {/* 回到頂部按鈕 */}
      <motion.div
        // 初始狀態：完全透明
        initial={{ opacity: 0 }}
        // 動畫狀態：完全不透明
        animate={{ opacity: 1 }}
        // 動畫持續時間：0.3秒
        transition={{ duration: 0.3 }}
        // 固定在右下角，確保在其他元素之上
        className="fixed bottom-6 right-6"
      >
        <button
          // 點擊時觸發回到頂部函數
          onClick={scrollToTop}
          // 按鈕樣式：漸變背景、圓形、陰影效果、過渡動畫等
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          {/* 向上箭頭SVG圖標 */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
};

export default HomePage;