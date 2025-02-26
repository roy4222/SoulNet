// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, auth, storage } from '../utils/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from '../utils/firebase';

// 引入自定義組件
import ProfileHeader from '../components/Profile/ProfileHeader';
import ProfileTabs from '../components/Profile/ProfileTabs';
import ProfilePostsList from '../components/Profile/ProfilePostsList';
import LoadingState from '../components/UI/LoadingState';
import ScrollToTopButton from '../components/ScrollToTopButton';
import BackButton from '../components/UI/BackButton';

// 預設頭像
const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCvBNjFR_6BVhW3lFNwF0oEk2N8JXjeiaSqg&s';

function Profile() {
    // 使用 React Router 的 navigate 函數進行頁面導航
    const navigate = useNavigate();
    
    // 定義狀態變數
    const [user, setUser] = useState(null);  // 儲存用戶資料
    const [posts, setPosts] = useState([]);  // 儲存用戶的文章
    const [reposts, setReposts] = useState([]);  // 儲存用戶的轉發文章
    const [isEditing, setIsEditing] = useState(false);  // 控制是否處於編輯模式
    const [isLoading, setIsLoading] = useState(true);  // 控制載入狀態
    const [error, setError] = useState('');  // 儲存錯誤訊息
    const [imagePreview, setImagePreview] = useState(null);  // 儲存頭像預覽 URL
    const [editForm, setEditForm] = useState({  // 儲存編輯表單的資料
        displayName: '',
        bio: '',
        avatar: null
    });
    const [activeTab, setActiveTab] = useState(0);  // 儲存目前的分頁索引

    // 處理表單提交
    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            setError('');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                throw new Error('用戶未登入');
            }

            // 檢查必要的環境變數
            const endpoint = import.meta.env.VITE_R2_ENDPOINT;
            const bucket = import.meta.env.VITE_R2_BUCKET;
            
            if (!endpoint || !bucket) {
                throw new Error('未設定 R2 配置');
            }

            let avatarUrl = user?.photoURL || DEFAULT_AVATAR;
            
            // 如果有新頭像，先上傳到 Cloudflare R2
            if (editForm.avatar) {
                const fileExtension = editForm.avatar.name.split('.').pop();
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 8);
                const fileName = `avatars/${currentUser.uid}_${timestamp}_${randomString}.${fileExtension}`;
                
                // 將 File 轉換為 ArrayBuffer
                const buffer = await editForm.avatar.arrayBuffer();
                
                // 上傳到 R2
                await r2Client.send(new PutObjectCommand({
                    Bucket: bucket,
                    Key: fileName,
                    Body: buffer,
                    ContentType: editForm.avatar.type,
                    CacheControl: 'no-cache',
                }));
                
                // 構建 R2 URL
                avatarUrl = `https://${endpoint}/${fileName}`;
                
                // 上傳成功後再刪除舊頭像
                if (user?.photoURL && user.photoURL !== DEFAULT_AVATAR) {
                    const oldFileName = user.photoURL.split('/').pop();
                    if (oldFileName.startsWith('avatars/')) {
                        await r2Client.send(new DeleteObjectCommand({
                            Bucket: bucket,
                            Key: oldFileName
                        }));
                    }
                }
            }

            // 並行更新 Auth 和 Firestore 資料
            await Promise.all([
                updateProfile(currentUser, {
                    displayName: editForm.displayName,
                    photoURL: avatarUrl
                }),
                updateDoc(doc(db, 'users', currentUser.uid), {
                    displayName: editForm.displayName,
                    bio: editForm.bio,
                    photoURL: avatarUrl,
                    updatedAt: new Date()
                })
            ]);

            // 直接更新本地狀態
            const updatedUserData = {
                ...user,
                displayName: editForm.displayName,
                photoURL: avatarUrl,
                bio: editForm.bio
            };
            setUser(updatedUserData);

            // 更新 localStorage
            const localStorageData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: editForm.displayName,
                photoURL: avatarUrl
            };
            localStorage.setItem('social:user', JSON.stringify(localStorageData));

            // 清除預覽和編輯狀態
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
                setImagePreview(null);
            }
            setIsEditing(false);

            // 觸發 auth 狀態變化
            const authEvent = new CustomEvent('auth-state-changed', {
                detail: { user: currentUser }
            });
            window.dispatchEvent(authEvent);

        } catch (err) {
            console.error('更新個人資料時發生錯誤:', err);
            setError(err.message || '更新資料時發生錯誤');
        } finally {
            setIsLoading(false);
        }
    };

    // 處理頭像上傳
    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                // 檢查檔案大小 (最大 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error('檔案大小不能超過 5MB');
                }
                
                // 檢查檔案類型
                if (!file.type.startsWith('image/')) {
                    throw new Error('只能上傳圖片檔案');
                }
                
                console.log('選擇的檔案:', file.name, '大小:', file.size, '類型:', file.type);
                
                // 創建預覽 URL
                const previewUrl = URL.createObjectURL(file);
                setImagePreview(previewUrl);
                
                setEditForm(prev => ({ ...prev, avatar: file }));
            } catch (err) {
                console.error('處理頭像時發生錯誤:', err);
                setError(err.message);
            }
        }
    };

    // 處理取消編輯
    const handleCancel = () => {
        setIsEditing(false);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        setEditForm(prev => ({
            ...prev,
            displayName: user?.displayName || '',
            bio: user?.bio || '',
            avatar: null
        }));
    };

    // 清理預覽 URL
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    // 使用 useEffect 鉤子在組件載入時獲取用戶資料
    useEffect(() => {
        const loadUserData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                // 獲取當前登入的用戶
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    navigate('/sign');  // 如果沒有登入，導向登入頁面
                    return;
                }

                const [userDoc, postsSnapshot, repostsSnapshot] = await Promise.all([
                    getDoc(doc(db, 'users', currentUser.uid)),
                    getDocs(query(collection(db, 'posts'), 
                        where('authorId', '==', currentUser.uid), 
                        where('isRepost', '==', false))),
                    getDocs(query(collection(db, 'posts'), 
                        where('authorId', '==', currentUser.uid), 
                        where('isRepost', '==', true)))
                ]);

                // 處理用戶資料
                if (userDoc.exists()) {
                    const userData = { ...currentUser, ...userDoc.data() };
                    userData.photoURL = userData.photoURL || DEFAULT_AVATAR;
                    setUser(userData);
                    setEditForm({ 
                        displayName: userData.displayName, 
                        bio: userData.bio || '', 
                        avatar: null 
                    });
                }

                // 處理文章和轉發文章
                const postsData = postsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
                    
                const repostsData = repostsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
                
                setPosts(postsData);
                setReposts(repostsData);
            } catch (err) {
                console.error('載入用戶資料時發生錯誤:', err);
                setError('載入資料時發生錯誤');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    // 處理分頁切換
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // 渲染主要的個人檔案頁面
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 py-8 max-w-4xl"
        >
            {/* 載入狀態或錯誤訊息 */}
            <LoadingState isLoading={isLoading} error={error} />

             {/* 返回按鈕 */}
             <BackButton navigate={navigate} />
            
            {/* 只有當不是載入中且沒有錯誤時才顯示內容 */}
            {!isLoading && !error && (
                <>
                    {/* 個人資料頭部 */}
                    <ProfileHeader 
                        user={user}
                        isEditing={isEditing}
                        imagePreview={imagePreview}
                        editForm={editForm}
                        isLoading={isLoading}
                        setEditForm={setEditForm}
                        setIsEditing={setIsEditing}
                        handleSubmit={handleSubmit}
                        handleAvatarChange={handleAvatarChange}
                        handleCancel={handleCancel}
                    />
                    
                    {/* 分頁選項 */}
                    <ProfileTabs 
                        activeTab={activeTab}
                        handleTabChange={handleTabChange}
                        postsCount={posts.length}
                        repostsCount={reposts.length}
                    />
                    
                    {/* 文章列表 */}
                    <ProfilePostsList 
                        posts={posts}
                        reposts={reposts}
                        activeTab={activeTab}
                        navigate={navigate}
                    />
                </>
            )}
        <ScrollToTopButton />
        </motion.div>
    );
}

export default Profile;