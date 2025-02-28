import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/UI/LoadingState';
import SuccessMessage from '../components/UI/SuccessMessage';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { AdminHeader, TabSelector, UserManagement, PostManagement } from '../components/Admin';

function AdminPanel() {
  const navigate = useNavigate();
  const { currentUser, userRole, isAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' 或 'posts'
  
  // 搜尋功能
  const [searchQuery, setSearchQuery] = useState('');
  
  // 排序狀態
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // 處理排序
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 排序文章列表
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'author') {
        comparison = a.author?.displayName.localeCompare(b.author?.displayName);
      } else if (sortField === 'createdAt') {
        comparison = a.createdAt?.toDate() - b.createdAt?.toDate();
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [posts, sortField, sortDirection]);
  
  // 搜尋過濾
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    return users.filter(user => 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);
  
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return sortedPosts;
    
    return sortedPosts.filter(post => 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedPosts, searchQuery]);
  
  // 檢查是否為管理員
  useEffect(() => {
    if (!currentUser) {
      navigate('/sign');
      return;
    }
    
    if (!isAdmin()) {
      setError('您沒有權限訪問管理員面板');
      return;
    }
    
    // 載入用戶和文章數據
    const fetchData = async () => {
      try {
        // 獲取所有用戶
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        
        // 獲取所有文章
        const postsSnapshot = await getDocs(collection(db, 'posts'));
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('載入數據時發生錯誤');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, isAdmin, navigate]);
  
  // 切換標籤時清空搜尋
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };
  
  // 更新用戶角色
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      
      // 更新本地狀態
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      setSuccessMessage('用戶角色已更新');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('更新用戶角色時發生錯誤');
    }
  };
  
  // 刪除文章
  const handleDeletePost = async (postId) => {
    if (window.confirm('確定要刪除這篇文章嗎？此操作無法撤銷。')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        
        // 更新本地狀態
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        
        setSuccessMessage('文章已成功刪除');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('刪除文章時發生錯誤');
      }
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
      <div className="max-w-6xl mx-auto px-4">
        
        {/* 頁面頂部：標題和搜尋欄 */}
        <AdminHeader 
          navigate={navigate} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          activeTab={activeTab} 
        />
        
        {/* 標籤切換 */}
        <TabSelector activeTab={activeTab} handleTabChange={handleTabChange} />
        
        {/* 用戶管理 */}
        {activeTab === 'users' && (
          <UserManagement 
            filteredUsers={filteredUsers} 
            currentUser={currentUser} 
            handleUpdateUserRole={handleUpdateUserRole} 
          />
        )}
        
        {/* 文章管理 */}
        {activeTab === 'posts' && (
          <PostManagement 
            filteredPosts={filteredPosts} 
            handleSort={handleSort} 
            sortField={sortField} 
            sortDirection={sortDirection} 
            handleDeletePost={handleDeletePost} 
          />
        )}

        <ScrollToTopButton />

        {/* 成功訊息 */}
        <SuccessMessage
          show={showSuccess}
          message={successMessage}
        />
      </div>
    </motion.div>
  );
}

export default AdminPanel;
