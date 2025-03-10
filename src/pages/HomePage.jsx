import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostInteractionButtons from '../components/Post/PostInteractionButtons';
import ScrollToTopButton from '../components/ScrollToTopButton';
import ImageModal from '../components/UI/ImageModal';
import SuccessMessage from '../components/UI/SuccessMessage';
import PostCard from '../components/Post/PostCard';
import CategorySidebar from '../components/Category/CategorySidebar';
import { shareUrl } from '../utils/ShareUtils';
import { ROUTES } from '../routes';

// localStorage 的 key
const USER_KEY = 'social:user';

// 定義HomePage組件
function HomePage() {
  // 定義狀態變量和鉤子
  const [users, setUsers] = useState({}); // 用戶資訊快取
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState(''); // 成功訊息類型
  const [repostedPostId, setRepostedPostId] = useState(null); // 轉發的文章ID
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
  const [searchQuery, setSearchQuery] = useState(''); // 搜尋關鍵字狀態
  const navigate = useNavigate();
  const location = useLocation(); // 用於獲取 URL 查詢參數
  const { currentUser } = useAuth();

  // 從 URL 查詢參數獲取搜尋關鍵字
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const search = queryParams.get('search');
    if (search) {
      setSearchQuery(search);
    } else {
      setSearchQuery(''); // 如果沒有搜尋參數，清空搜尋關鍵字
    }
  }, [location.search]);

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

  // 處理轉發功能
  const handleRepost = async (post) => {
    // 檢查用戶是否已登入，如果未登入則導向登入頁面
    if (!currentUser) {
      navigate('/sign');
      return;
    }

    // 檢查用戶是否已經轉發過這篇文章
    if (post.reposts?.includes(currentUser.uid)) {
      alert('您已經轉發過這篇文章');
      return;
    }

    try {
      // 立即更新本地狀態，防止重複點擊
      const updatedPosts = posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            reposts: [...(p.reposts || []), currentUser.uid]
          };
        }
        return p;
      });
      setPosts(updatedPosts);

      // 獲取文章的引用
      const postRef = doc(db, 'posts', post.id);
      
      // 創建新的轉發文章
      const repostData = {
        title: post.title || '無標題',
        content: post.content || '無內容',
        author: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '匿名用戶',
          photoURL: currentUser.photoURL,
          email: currentUser.email
        },
        createdAt: Timestamp.now(),
        likes: [],
        comments: [],
        reposts: [],
        isRepost: true,
        originalPostId: post.id,
        originalAuthor: post.author?.displayName || '匿名用戶',
        // 支持多張圖片
        imageUrls: post.imageUrls || (post.imageUrl ? [post.imageUrl] : []),
        category: post.category || post.topic || 'other'
      };

      // 將轉發文章添加到 posts collection
      const docRef = await addDoc(collection(db, 'posts'), repostData);
      
      // 更新原文章的轉發計數
      await updateDoc(postRef, {
        reposts: arrayUnion(currentUser.uid)
      });
      
      // 設置轉發的文章ID
      setRepostedPostId(docRef.id);
      // 設置成功訊息類型
      setSuccessMessageType('repost');
      // 顯示成功訊息
      setShowSuccess(true);
      // 3秒後隱藏成功訊息
      setTimeout(() => {
        setShowSuccess(false);
        setRepostedPostId(null);
      }, 3000);
     
    } catch (error) {
      console.error('Error reposting:', error);
      alert('轉發失敗，請稍後再試');
      
      // 如果失敗，恢復本地狀態
      const revertedPosts = posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            reposts: (p.reposts || []).filter(uid => uid !== currentUser.uid)
          };
        }
        return p;
      });
      setPosts(revertedPosts);
    }
  };

  // 處理分享功能
  const handleShare = (post) => {
    // 使用 ShareUtils 中的 shareUrl 函數
    shareUrl(
      `${window.location.origin}/post/${post.id}`,
      setSuccessMessageType,
      setShowSuccess,
      1000
    );
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
          
          // 篩選掉轉發文章，首頁不顯示轉發文章
          if (postData.isRepost === true) {
            return;
          }
          
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

  // 根據選中的分類和搜尋關鍵字過濾文章
  const filteredPosts = posts.filter(post => {
    // 先根據分類過濾
    const categoryMatch = selectedCategory === 'all' || 
                          post.category === selectedCategory || 
                          post.topic === selectedCategory;
    
    // 如果沒有搜尋關鍵字，只根據分類過濾
    if (!searchQuery.trim()) {
      return categoryMatch;
    }
    
    // 如果有搜尋關鍵字，同時根據分類和搜尋關鍵字過濾
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = post.title && post.title.toLowerCase().includes(query);
    const contentMatch = post.content && post.content.toLowerCase().includes(query);
    const authorMatch = post.author && post.author.displayName && 
                        post.author.displayName.toLowerCase().includes(query);
    
    return categoryMatch && (titleMatch || contentMatch || authorMatch);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 lg:gap-8">
          <CategorySidebar 
            categories={categories}
            isLoading={isLoading}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
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

            {/* 搜尋結果提示 */}
            {searchQuery.trim() && (
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-blue-700 dark:text-blue-300">
                    搜尋結果：「{searchQuery}」{filteredPosts.length > 0 ? `(找到 ${filteredPosts.length} 筆結果)` : '(沒有找到結果)'}
                  </p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      navigate(ROUTES.HOME);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    清除搜尋
                  </button>
                </div>
              </div>
            )}

            {/* 文章列表區域 */}
            <div className="grid gap-4 sm:gap-6">
              {isLoadingPosts ? (
                // 加載中顯示旋轉動畫
                <div className="flex justify-center">
                  <svg className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S16.627 6 12 6z"></path>
                  </svg>
                </div>
              ) : (
                // 渲染過濾後的文章列表
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
                    onShare={(post) => {
                      console.log('PostCard 調用 onShare，post:', post);
                      handleShare(post);
                    }}
                    onRepost={() => handleRepost(post)}
                    navigate={navigate}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 圖片模態框組件 */}
      <ImageModal 
        isOpen={isImageModalOpen}
        imageUrl={selectedImage}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedImage(null);
        }}
      />
      {/* 回到頂部按鈕組件 */}
      <ScrollToTopButton />
      {/* 使用 SuccessMessage 組件顯示操作成功訊息 */}
      <SuccessMessage 
          show={showSuccess} // 控制訊息的顯示與隱藏
          message={
            // 根據操作類型顯示不同的成功訊息
            successMessageType === 'share' 
              ? "連結已複製到剪貼簿！" 
              : successMessageType === 'repost' 
                ? "轉發成功！"
                : "評論發佈成功！"
          }
          actionText={
            // 僅在轉發成功且有轉發文章ID時顯示"查看轉發"按鈕
            successMessageType === 'repost' && repostedPostId ? "查看轉發" : null
          }
          onAction={
            // 點擊"查看轉發"按鈕時的處理函數
            successMessageType === 'repost' && repostedPostId 
              ? () => {
                console.log('successMessageType:', successMessageType);
                console.log('repostedPostId:', repostedPostId);
                console.log('ROUTES.PROFILE:', ROUTES.PROFILE);
                navigate(ROUTES.PROFILE) 
              } 
              : null
          }
        />
    </div>
  );
};

export default HomePage;