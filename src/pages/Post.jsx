// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp, collection, addDoc } from 'firebase/firestore';
import {TextField, Button } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// localStorage 的 key
const USER_KEY = 'social:user';

// 定義 Post 組件
function Post() {
  // 定義狀態變量和鉤子
  const [user, setUser] = useState(() => {
    // 初始化時從 localStorage 讀取用戶資訊
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  // 使用 React Router 的 hooks
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 使用自定義的 Auth hook
  const { currentUser } = useAuth();
  
  // 定義狀態變數
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [views, setViews] = useState(0);

  // 格式化時間的輔助函數
  const formatTime = (timestamp) => {
    try {
      // 如果是 Firestore Timestamp
      if (timestamp?.toDate) {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: zhTW });
      }
      // 如果是普通的 Date 對象或時間戳
      if (timestamp) {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: zhTW });
      }
      return '時間未知';
    } catch (error) {
      console.error('Error formatting time:', error);
      return '時間未知';
    }
  };

  // 使用 useEffect 鉤子在組件掛載時獲取文章數據
  useEffect(() => {
    // 定義異步函數 fetchPost 來獲取文章數據
    const fetchPost = async () => {
      try {
        // 從 Firestore 數據庫獲取指定 id 的文章文檔
        const postDoc = await getDoc(doc(db, 'posts', id));

        // 檢查文檔是否存在
        if (postDoc.exists()) {
          // 獲取文檔數據
          const postData = postDoc.data();

          // 設置文章狀態，包括 id 和所有文檔數據
          setPost({ 
            id: postDoc.id, 
            ...postData,
            // 保持原始 Timestamp，在顯示時再轉換
            createdAt: postData.createdAt
          });

          // 更新文章的瀏覽次數
          const currentViews = postData.views || 0;
          // 在 Firestore 中更新瀏覽次數
          await updateDoc(doc(db, 'posts', id), {
            views: currentViews + 1
          });
          // 更新本地狀態中的瀏覽次數
          setViews(currentViews + 1);
        } else {
          // 如果文檔不存在，設置錯誤狀態
          setError('找不到這篇文章');
        }
      } catch (error) {
        // 捕獲並處理任何錯誤
        console.error('Error fetching post:', error);
        setError('載入文章時發生錯誤');
      } finally {
        // 無論成功與否，都將加載狀態設為 false
        setIsLoading(false);
      }
    };

    // 調用 fetchPost 函數
    fetchPost();
  }, [id]); // 依賴項數組中包含 id，當 id 變化時重新執行 effect

  // 處理點讚功能
  const handleLike = async () => {
    if (!currentUser) {
      navigate('/sign');
      return;
    }

    try {
      const postRef = doc(db, 'posts', id);
      const isLiked = post.likes?.includes(currentUser.uid);
      
      await updateDoc(postRef, {
        likes: isLiked 
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid)
      });

      setPost(prev => ({
        ...prev,
        likes: isLiked
          ? prev.likes.filter(id => id !== currentUser.uid)
          : [...(prev.likes || []), currentUser.uid]
      }));
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  // 處理評論功能
  const handleComment = async (e) => {
    e.preventDefault();
    // 檢查用戶是否已登入，如果未登入則導向登入頁面
    if (!currentUser) {
      navigate('/sign');
      return;
    }

    // 檢查評論內容是否為空
    if (!comment) return;

    try {
      // 獲取文章的引用
      const postRef = doc(db, 'posts', id);
      // 創建新的評論對象
      const newComment = {
        content: comment,
        author: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || '匿名用戶',
          photoURL: currentUser.photoURL
        },
        // 使用 Firestore Timestamp 記錄評論創建時間
        createdAt: Timestamp.now()
      };

      // 更新文章文檔，將新評論添加到評論陣列中
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      // 更新本地狀態，將新評論添加到評論陣列中
      setPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      // 清空評論輸入框
      setComment('');
    } catch (error) {
      // 捕獲並記錄錯誤
      console.error('Error adding comment:', error);
    }
  };

  // 處理分享功能
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('連結已複製到剪貼簿！');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // 處理轉發功能
  const handleRepost = async () => {
    // 檢查用戶是否已登入，如果未登入則導向登入頁面
    if (!currentUser) {
      navigate('/sign');
      return;
    }

    try {
      // 獲取文章的引用
      const postRef = doc(db, 'posts', id);
      
      // 創建新的轉發文章
      const repostData = {
        title: post.title,
        content: post.content,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '匿名用戶',
        authorPhoto: currentUser.photoURL,
        createdAt: Timestamp.now(),
        likes: [],
        comments: [],
        reposts: [],
        isRepost: true,
        originalPostId: id,
        originalAuthor: post.authorName,
        images: post.images || []
      };

      // 將轉發文章添加到 posts collection
      const docRef = await addDoc(collection(db, 'posts'), repostData);
      
      // 更新原文章的轉發計數
      await updateDoc(postRef, {
        reposts: arrayUnion(currentUser.uid)
      });

      // 更新本地狀態
      setPost(prev => ({
        ...prev,
        reposts: [...(prev.reposts || []), currentUser.uid]
      }));

      // 提示用戶轉發成功
      alert('轉發成功！');
      
      // 導航到新創建的轉發文章
      navigate(`/post/${docRef.id}`);
    } catch (error) {
      console.error('Error reposting:', error);
      alert('轉發失敗，請稍後再試');
    }
  };

  // 顯示加載中的狀態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 顯示錯誤信息
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{error}</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            返回上一頁
          </button>
        </div>
      </div>
    );
  }

  // 如果沒有文章數據，返回 null
  if (!post) return null;

  // 渲染文章內容
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按鈕 */}
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
        >
          <ArrowBackIcon className="w-5 h-5" />
        </motion.button>

        {/* 文章內容 */}
        <motion.article
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md mb-6"
        >
          {/* 文章標題和作者資訊 */}
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user.photoURL || DEFAULT_AVATAR}  
              alt= {user.displayName || '使用者'}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {user.displayName || '使用者'}
              </h3>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>

          {/* 文章內容 */}
          <div className="prose dark:prose-invert max-w-none mb-6">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
              {post.content}
            </pre>
          </div>

          {/* 文章圖片 */}
          {post.imageUrl && (
            <div className="mb-6">
              <img
                src={post.imageUrl}
                alt="文章圖片"
                className="w-full h-auto rounded-lg cursor-pointer"
                onClick={() => {
                  setSelectedImage(post.imageUrl);
                  setIsImageModalOpen(true);
                }}
              />
            </div>
          )}

          {/* 互動按鈕區域 */}
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            {/* 點讚按鈕 */}
            <button 
              onClick={handleLike}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
            >
              {post.likes?.includes(currentUser?.uid) 
                ? <FavoriteRoundedIcon className="w-6 h-6 text-red-500" />
                : <FavoriteBorderRoundedIcon className="w-6 h-6 group-hover:text-red-500" />
              }
              <span className="text-sm font-medium">{post.likes?.length || 0}</span>
              {/* 滑鼠懸停時顯示的提示文字 */}
              <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">點讚</span>
            </button>

            {/* 評論按鈕 */}
            <button 
              onClick={() => {
                document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="group-hover:text-blue-500">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 1 0-9-9c0 1.488.36 2.891 1 4.127L3 21l4.873-1c1.236.64 2.64 1 4.127 1"/>
              </svg>
              <span className="text-sm font-medium">{post.comments?.length || 0}</span>
              {/* 滑鼠懸停時顯示的提示文字 */}
              <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">評論</span>
            </button>

            {/* 轉發按鈕 */}
            <button 
              onClick={handleRepost}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21 21" className="group-hover:text-green-500">
                <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m13.5 13.5l3 3l3-3"/>
                  <path d="M9.5 4.5h3a4 4 0 0 1 4 4v8m-9-9l-3-3l-3 3"/>
                  <path d="M11.5 16.5h-3a4 4 0 0 1-4-4v-8"/>
                </g>
              </svg>
              <span className="text-sm font-medium">{post.reposts?.length || 0}</span>
               {/* 滑鼠懸停時顯示的提示文字 */}
               <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">轉發</span>
            </button>
            {/* 分享按鈕 */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 group relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="group-hover:text-blue-500">
                <path fill="currentColor" d="M13 14h-2a9 9 0 0 0-7.968 4.81A10 10 0 0 1 3 18C3 12.477 7.477 8 13 8V3l10 8l-10 8z"/>
              </svg>
              <span className="text-sm font-medium">{post.shares || 0}</span>
               {/* 滑鼠懸停時顯示的提示文字 */}
               <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">分享</span>
            </button>

            {/* 觀看次數 */}
            <div className="flex items-center gap-2 p-2 group relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" className="text-gray-500 dark:text-gray-400 w-5 h-5">
                <path fill="none" stroke="currentColor" stroke-width="2" d="M16 5a4 4 0 1 1-8 0a4 4 0 0 1 8 0Zm-1 18v-6h3v-2c0-3.34-2.76-5.97-6-6c-3.21.03-6 2.66-6 6v2h3v6m-5.5 0h17z"/>
              </svg>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{post.views || 0}</span>
               {/* 滑鼠懸停時顯示的提示文字 */}
               <span className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">查看次數</span>
            </div>
          </div>
        </motion.article>
        

        {/* 評論區塊 */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}  // 初始狀態：向下偏移20px，完全透明
          animate={{ y: 0, opacity: 1 }}   // 動畫結束狀態：回到原位，完全不透明
          transition={{ duration: 0.3, delay: 0.2 }}  // 動畫持續0.3秒，延遲0.2秒開始
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"  // 樣式：白色背景（深色模式為深灰），內邊距，圓角，陰影
          id="comments"  // 用於定位的ID
        >
          {/* 評論數量標題 */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            評論 ({post.comments?.length || 0})  {/* 顯示評論數量，如果沒有評論則顯示0 */}
          </h2>

          {/* 評論輸入表單 */}
          <form onSubmit={handleComment} className="mb-10">
            {/* 多行文本輸入框 */}
            <TextField
              multiline  // 允許多行輸入
              rows={4}  // 設置4行高度
              fullWidth  // 佔滿整個寬度
              value={comment}  // 綁定評論內容
              onChange={(e) => setComment(e.target.value)}  // 更新評論內容
              placeholder="分享你的想法..."  // 佔位符文本
              className="mb-6 bg-white dark:bg-gray-700"  // 樣式：下邊距，背景色
              InputProps={{
                className: 'dark:text-white rounded-lg',  // 深色模式文字顏色，圓角
              }}
            />
            {/* 按鈕容器 */}
            <div className="flex justify-end space-x-4 mt-4">
              {/* 取消按鈕 */}
              <Button 
                type="button" 
                variant="outlined"
                onClick={() => setComment('')}  // 點擊時清空評論
                className="px-6 py-2 rounded-full text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                取消
              </Button>
              {/* 發表評論按鈕 */}
              <Button 
                type="submit" 
                variant="contained" 
                disabled={!comment}  // 當評論為空時禁用按鈕
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-indigo-600 dark:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800 text-white font-semibold px-8 py-2 rounded-full shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center text-white">
                  {/* 發送圖標 */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-white"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M20.25 3.532a1 1 0 0 1 1.183 1.329l-6 15.5a1 1 0 0 1-1.624.362l-3.382-3.235l-1.203 1.202c-.636.636-1.724.186-1.724-.714v-3.288L2.309 9.723a1 1 0 0 1 .442-1.691l17.5-4.5Zm-2.114 4.305l-7.998 6.607l3.97 3.798zm-1.578-1.29L4.991 9.52l3.692 3.53l7.875-6.505Z"/></g></svg>
                  發表評論
                </span>
              </Button>
            </div>
          </form>

          {/* 評論列表 */}
          <div className="space-y-8">
            {post.comments?.map((comment, index) => (
              // 使用 motion.div 創建動畫效果的評論項目
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}  // 初始狀態：透明度為0，向下偏移20px
                animate={{ opacity: 1, y: 0 }}   // 動畫結束狀態：完全不透明，回到原位
                transition={{ duration: 0.3, delay: index * 0.1 }}  // 動畫持續0.3秒，每個評論延遲0.1秒
                className="flex gap-4 items-start"
              >
                {/* 評論者頭像 */}
                <img 
                  src={user.photoURL || DEFAULT_AVATAR} 
                  alt= {user.displayName || '使用者'}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {/* 評論內容區塊 */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {/* 評論者信息和時間 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {user.displayName || '使用者'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(comment.createdAt?.toDate(), { addSuffix: true, locale: zhTW })}
                    </span>
                  </div>
                  {/* 評論文字內容 */}
                  <p className="text-gray-700 dark:text-gray-300 text-lg whitespace-pre-wrap">{comment.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
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
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.div>
  );
}

// 導出 Post 組件
export default Post;