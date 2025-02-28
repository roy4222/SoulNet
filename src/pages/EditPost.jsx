import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/UI/BackButton';
import LoadingState from '../components/UI/LoadingState';
import SuccessMessage from '../components/UI/SuccessMessage';

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole, isAdmin } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [post, setPost] = useState(null);
  
  // 分類狀態
  const [categories, setCategories] = useState([]);

  // 從 Firebase 獲取分類數據
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesRef = collection(db, 'topics');
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    };

    fetchCategories();
  }, []);

  // 檢查當前用戶是否有權限編輯此文章
  const checkPermission = (postData) => {
    // 管理員可以編輯任何文章
    if (isAdmin()) return true;
    
    // 作者可以編輯自己的文章
    return currentUser && postData.author && postData.author.uid === currentUser.uid;
  };
  
  // 獲取文章數據
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', id));
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setPost({ id: postDoc.id, ...postData });
          
          // 檢查權限
          if (!checkPermission(postData)) {
            setError('您沒有權限編輯此文章');
            return;
          }
          
          // 設置表單數據
          setTitle(postData.title || '');
          setContent(postData.content || '');
          setCategory(postData.category || 'other');
        } else {
          setError('找不到這篇文章');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('載入文章時發生錯誤');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPost();
  }, [id, currentUser, isAdmin]);
  
  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('標題和內容不能為空');
      return;
    }
    
    try {
      // 更新文章數據
      await updateDoc(doc(db, 'posts', id), {
        title,
        content,
        category,
        updatedAt: Timestamp.now()
      });
      
      // 顯示成功訊息
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/post/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('更新文章時發生錯誤');
    }
  };
  
  // 如果正在加載或有錯誤，顯示相應狀態
  if (isLoading || error) {
    return <LoadingState isLoading={isLoading} error={error} />;
  }
  
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
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">編輯文章</h1>
          
          <form onSubmit={handleSubmit}>
            {/* 標題輸入 */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                標題
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="請輸入文章標題"
                required
              />
            </div>
            
            {/* 分類選擇 */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                分類
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 內容輸入 */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                內容
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[200px]"
                placeholder="請輸入文章內容"
              />
            </div>
            
            {/* 提交按鈕 */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/post/${id}`)}
                className="mr-2 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                更新文章
              </button>
            </div>
          </form>
        </motion.div>
        
        {/* 成功訊息 */}
        <SuccessMessage
          show={showSuccess}
          message="文章已成功更新！"
        />
      </div>
    </motion.div>
  );
}

export default EditPost;
