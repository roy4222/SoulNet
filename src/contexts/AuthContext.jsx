// 引入必要的 React hooks 和 Firebase 身份驗證方法
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// 創建身份驗證 Context
const AuthContext = createContext();

// 創建 AuthProvider 組件，用於包裝應用並提供身份驗證狀態
export function AuthProvider({ children }) {
  // 管理當前用戶狀態和加載狀態
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 添加用戶角色狀態
  const [loading, setLoading] = useState(true);

  // 用戶註冊函數
  const register = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 註冊成功後更新用戶顯示名稱
      await updateProfile(userCredential.user, { displayName });
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  // 用戶登入函數
  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  // 用戶登出函數
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null); // 登出時清除角色
    } catch (error) {
      throw error;
    }
  };

  // 檢查用戶是否為管理員
  const isAdmin = () => {
    return userRole === 'admin';
  };

  // 重新驗證用戶
  const reauthenticateUser = async (currentPassword) => {
    try {
      // 檢查是否有當前登入的用戶
      if (!currentUser) {
        throw new Error('沒有登入的用戶');
      }
      
      // 創建包含用戶電子郵件和密碼的憑證
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      // 使用提供的憑證重新驗證用戶身份
      await reauthenticateWithCredential(currentUser, credential);
      return true;
    } catch (error) {
      // 記錄錯誤並向上拋出以便調用者處理
      console.error('重新驗證失敗:', error);
      throw error;
    }
  };

  // 更新用戶密碼
  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      if (!currentUser) {
        throw new Error('沒有登入的用戶');
      }
      
      // 先重新驗證用戶
      await reauthenticateUser(currentPassword);
      
      // 更新密碼
      await updatePassword(currentUser, newPassword);
      return true;
    } catch (error) {
      console.error('更新密碼失敗:', error);
      throw error;
    }
  };

  // 使用 useEffect 監聽用戶身份驗證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // 如果用戶已登入，獲取用戶角色
      if (user) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'user'); // 設置用戶角色，默認為 'user'
          } else {
            setUserRole('user'); // 如果沒有找到用戶文檔，默認為普通用戶
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // 發生錯誤時，默認為普通用戶
        }
      }
      
      setLoading(false);
    });

    // 組件卸載時取消訂閱
    return unsubscribe;
  }, []);

  // 準備要提供給子組件的值
  const value = {
    currentUser,
    userRole,
    isAdmin,
    register,
    login,
    logout,
    reauthenticateUser,
    updateUserPassword,
    loading
  };

  // 返回 AuthContext.Provider，為子組件提供身份驗證狀態和方法
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 自定義 Hook，方便在其他組件中使用身份驗證 Context
export function useAuth() {
  return useContext(AuthContext);
}
