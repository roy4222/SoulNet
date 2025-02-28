import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiEdit, FiTrash2, FiMoreVertical } from 'react-icons/fi';

function PostActions({ post, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const { currentUser, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  // 檢查當前用戶是否有權限編輯/刪除文章
  const canModify = () => {
    // 管理員可以編輯/刪除任何文章
    if (isAdmin()) return true;
    
    // 作者可以編輯/刪除自己的文章
    return currentUser && post.author && post.author.uid === currentUser.uid;
  };

  // 處理刪除文章
  const handleDelete = async () => {
    if (!canModify()) return;

    if (window.confirm('確定要刪除這篇文章嗎？此操作無法撤銷。')) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
        alert('文章已成功刪除');
        navigate('/');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('刪除文章時發生錯誤');
      }
    }
  };

  // 處理編輯文章
  const handleEdit = () => {
    if (!canModify()) return;
    
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/edit-post/${post.id}`);
    }
  };

  // 如果用戶沒有權限，不顯示操作按鈕
  if (!canModify()) return null;

  return (
    <div className="relative">
      {/* 更多選項按鈕 */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <FiMoreVertical className="text-gray-500 dark:text-gray-400" />
      </button>

      {/* 下拉選單 */}
      {showMenu && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {/* 編輯按鈕 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEdit();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              <FiEdit className="mr-2" />
              編輯文章
            </button>

            {/* 刪除按鈕 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
                setShowMenu(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              <FiTrash2 className="mr-2" />
              刪除文章
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostActions;
