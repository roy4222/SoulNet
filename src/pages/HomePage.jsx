import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Fab } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Link, useNavigate } from 'react-router-dom';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { useAuth } from '../contexts/AuthContext';
import PostInteractionButtons from '../components/Post/PostInteractionButtons';
import ScrollToTopButton from '../components/ScrollToTopButton';
import ImageModal from '../components/ImageModal';
import SuccessToast from '../components/Toast/SuccessToast';
import PostCard from '../components/Post/PostCard';
import CategorySidebar from '../components/Category/CategorySidebar';

// localStorage 的 key
const USER_KEY = 'social:user';
// 默認頭像
const DEFAULT_AVATAR = 'https://pub-6ee61ab59e054c0facbe8351ca1efce0.r2.dev/default-avatar.png';

// 定義HomePage組件
function HomePage() {
  // 定義狀態變量和鉤子
  const [users, setUsers] = useState({}); // 用戶資訊快取
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState(() => {
    // 初始化時從 localStorage 讀取用戶資訊
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
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

  // 處理點讚功能
  const handleLike = async (post) => {
    // 檢查用戶是否已登入，如果未登入則導向登入頁面
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // 獲取文章的引用
      const postRef = doc(db, 'posts', post.id);
      // 檢查當前用戶是否已經點讚
      const isLiked = post.likes?.includes(currentUser.uid);
      
      // 更新文章文檔，根據是否已點讚來添加或移除用戶ID
      await updateDoc(postRef, {
        likes: isLiked 
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid)
      });

      // 更新本地狀態
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === post.id
            ? { 
                ...p, 
                likes: isLiked
                  ? p.likes.filter(id => id !== currentUser.uid) // 移除當前用戶的點讚
                  : [...(p.likes || []), currentUser.uid] // 添加當前用戶的點讚
              }
            : p
        )
      );
    } catch (error) {
      // 如果發生錯誤，將錯誤信息輸出到控制台
      console.error('Error updating like:', error);
    }
  };

  // 獲取用戶資訊的函數
  const fetchUserInfo = async (uid) => {
    if (!uid) return null;
    
    // 如果快取中已有該用戶資訊,直接返回
    if (users[uid]) return users[uid];

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // 更新快取
        setUsers(prev => ({
          ...prev,
          [uid]: userData
        }));
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
    return null;
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
        
        // 獲取所有文章作者的 uid
        const authorUids = new Set();
        querySnapshot.forEach(doc => {
          const postData = doc.data();
          if (postData.author?.uid) {
            authorUids.add(postData.author.uid);
          }
        });

        // 預先獲取所有作者的資訊
        const userPromises = Array.from(authorUids).map(uid => fetchUserInfo(uid));
        await Promise.all(userPromises);
        
        querySnapshot.forEach((doc) => {
          const postData = doc.data();
          let imageUrl = postData.imageUrl;
          
          if (imageUrl) {
            if (imageUrl.includes('cloudflarestorage.com')) {
              const urlParts = imageUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const endpoint = import.meta.env.VITE_R2_ENDPOINT;
              imageUrl = `https://${endpoint}/${fileName}`;
            }
          }
          
          fetchedPosts.push({
            id: doc.id,
            ...postData,
            imageUrl
          });
        });
        
        fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
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

  const handleShare = async (post) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 lg:gap-8">
          <CategorySidebar 
            categories={categories}
            isLoading={isLoading}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onScrollToTop={scrollToTop}
          />

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
                  <PostCard
                    key={post.id}
                    post={post}
                    users={users}
                    currentUser={currentUser}
                    categories={categories}
                    expandedPosts={expandedPosts}
                    onToggleExpand={togglePostExpansion}
                    onImageClick={(imageUrl) => {
                      setSelectedImage(imageUrl);
                      setIsImageModalOpen(true);
                    }}
                    onLike={handleLike}
                    onShare={handleShare}
                    navigate={navigate}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <ImageModal 
        isOpen={isImageModalOpen}
        imageUrl={selectedImage}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedImage(null);
        }}
      />
      <ScrollToTopButton />
      <SuccessToast show={showSuccess} />
    </div>
  );
};

export default HomePage;