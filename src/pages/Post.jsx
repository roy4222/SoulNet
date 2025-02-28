// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 引入自定義組件
import PostHeader from '../components/Post/PostHeader';
import PostContent from '../components/Post/PostContent';
import PostCommentForm from '../components/Post/PostCommentForm';
import PostCommentsList from '../components/Post/PostCommentsList';
import PostInteractionButtons from '../components/Post/PostInteractionButtons';
import LoadingState from '../components/UI/LoadingState';
import ImageModal from '../components/UI/ImageModal';
import SuccessMessage from '../components/UI/SuccessMessage';
import BackButton from '../components/UI/BackButton';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { ROUTES } from '../routes';
import { shareUrl } from '../utils/ShareUtils';

// 定義 Post 組件
function Post() {
  // 定義狀態變量和鉤子
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [views, setViews] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState('share'); // 'share' 或 'repost'
  const [repostedPostId, setRepostedPostId] = useState(null); // 存儲新創建的轉發文章ID
  // 添加排序方式狀態，預設為 'newest'
  const [sortOrder, setSortOrder] = useState('newest');
  

  // 使用 React Router 的 hooks
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 使用自定義的 Auth hook
  const { currentUser } = useAuth();
  
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

          // 獲取作者的最新資訊
          const authorDoc = await getDoc(doc(db, 'users', postData.author.uid));
          const authorData = authorDoc.exists() ? authorDoc.data() : null;

          // 合併作者的最新資訊
          const updatedAuthor = authorData ? {
            ...postData.author,
            displayName: authorData.displayName || postData.author.displayName,
            photoURL: authorData.photoURL || postData.author.photoURL
          } : postData.author;

          // 更新評論中的作者資訊
          const updatedComments = await Promise.all((postData.comments || []).map(async (comment) => {
            try {
              const commentAuthorDoc = await getDoc(doc(db, 'users', comment.author.uid));
              const commentAuthorData = commentAuthorDoc.exists() ? commentAuthorDoc.data() : null;
              
              // 如果找到作者資訊就更新,否則保持原樣
              const updatedCommentAuthor = commentAuthorData ? {
                ...comment.author,
                displayName: commentAuthorData.displayName || comment.author.displayName,
                photoURL: commentAuthorData.photoURL || comment.author.photoURL
              } : comment.author;

              return {
                ...comment,
                author: updatedCommentAuthor
              };
            } catch (error) {
              console.error('Error fetching comment author:', error);
              return comment;
            }
          }));

          // 設置文章狀態，包括最新的作者資訊和評論
          setPost({ 
            id: postDoc.id, 
            ...postData,
            author: updatedAuthor,
            comments: updatedComments,
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
    
    // 清理函數
    return () => {
      // 組件卸載時重置狀態
      setPost(null);
      setIsLoading(true);
      setError('');
    };
  }, [id, location]); // 添加 location 作為依賴，確保每次頁面導航時都重新獲取數據

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

      // 顯示成功提示
      setShowSuccess(true);
      setSuccessMessageType('comment');
      setTimeout(() => setShowSuccess(false), 2000);

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
    // 使用 ShareUtils 中的 shareUrl 函數
    shareUrl(
      window.location.href,
      setSuccessMessageType,
      setShowSuccess,
      1000
    );
  };

  // 處理轉發功能
  const handleRepost = async () => {
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
      setPost(prev => ({
        ...prev,
        reposts: [...(prev.reposts || []), currentUser.uid]
      }));

      // 獲取文章的引用
      const postRef = doc(db, 'posts', id);
      
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
        originalPostId: id,
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
      
      // 顯示成功訊息
      setShowSuccess(true);
      setSuccessMessageType('repost');
      
      // 儲存新創建的文章ID，以便稍後使用
      const newPostId = docRef.id;
      setRepostedPostId(newPostId);
      
      // 只顯示成功訊息，不自動導航
      setTimeout(() => {
        setShowSuccess(false);
        setRepostedPostId(null); // 清除轉發文章ID
      }, 2000);
    } catch (error) {
      console.error('Error reposting:', error);
      alert('轉發失敗，請稍後再試');
      
      // 如果失敗，恢復本地狀態
      setPost(prev => ({
        ...prev,
        reposts: (prev.reposts || []).filter(uid => uid !== currentUser.uid)
      }));
    }
  };

  // 使用 LoadingState 組件顯示加載中或錯誤狀態
  if (isLoading || error) {
    return <LoadingState isLoading={isLoading} error={error} />;
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
        <BackButton navigate={navigate} />
        
        {/* 文章內容 */}
        <motion.article
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md mb-6"
        >
          {/* 使用 PostHeader 組件 */}
          <PostHeader post={post} />

          {/* 使用 PostContent 組件 */}
          <PostContent 
            post={post} 
            onImageClick={(imageUrl) => {
              setSelectedImage(imageUrl);
              setIsImageModalOpen(true);
            }} 
          />

          {/* 使用 PostInteractionButtons 組件 */}
          <PostInteractionButtons 
            post={post}
            currentUser={currentUser}
            onLike={handleLike}
            navigate={navigate}
            onShare={handleShare}
            onRepost={handleRepost}
          />
        </motion.article>
        
        {/* 評論區塊 */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
          id="comments"
        >
          {/* 使用 PostCommentForm 組件 */}
          <PostCommentForm 
            comment={comment}
            setComment={setComment}
            handleComment={handleComment}
          />

          {/* 使用 PostCommentsList 組件 */}
          <PostCommentsList 
            comments={post.comments}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            formatTime={formatTime}
          />
        </motion.section>

        {/* 使用 ImageModal 組件 */}
        <ImageModal 
          isOpen={isImageModalOpen}
          imageUrl={selectedImage}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }}
        />

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
      <ScrollToTopButton />
    </motion.div>
  );
}

// 導出 Post 組件
export default Post;