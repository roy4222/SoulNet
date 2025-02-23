// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, auth, storage } from '../utils/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Avatar, Button, TextField, IconButton, CircularProgress, Card, CardContent, Typography, Grid, Divider, Tabs, Tab } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageIcon from '@mui/icons-material/Image';
import RepeatIcon from '@mui/icons-material/Repeat';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from '../utils/firebase';

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

    // 如果正在載入，顯示載入中的畫面
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <CircularProgress />
            </div>
        );
    }

    // 如果有錯誤，顯示錯誤訊息
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Typography color="error">{error}</Typography>
            </div>
        );
    }

    // 渲染主要的個人檔案頁面
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 py-8 max-w-4xl"
        >
            <Card className="mb-8 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-12">
                        {/* 頭像部分 */}
                        <div className="relative group mb-6 md:mb-0">
                            <div className="rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700">
                                <Avatar
                                    src={isEditing && imagePreview ? imagePreview : (user?.photoURL || DEFAULT_AVATAR)}
                                    alt={user?.displayName}
                                    sx={{ 
                                        width: 180, 
                                        height: 180,
                                        transition: 'transform 0.3s ease-in-out',
                                        '&:hover': {
                                            transform: 'scale(1.05)'
                                        }
                                    }}
                                />
                            </div>
                            {/* 編輯模式下顯示頭像上傳選項 */}
                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                                    {/* 隱藏的文件輸入框 */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="avatar-upload"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    {/* 自定義的上傳按鈕 */}
                                    <label htmlFor="avatar-upload" className="cursor-pointer transform transition-transform duration-200 hover:scale-110">
                                        <IconButton 
                                            component="span" 
                                            className="bg-white/90 hover:bg-white"
                                            sx={{
                                                padding: '12px',
                                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.95)' }
                                            }}
                                        >
                                            <ImageIcon />
                                        </IconButton>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* 用戶資料部分 */}
                        <div className="flex-1 w-full max-w-xl">
                            {isEditing ? (
                                <div className="space-y-6">
                                    <input
                                        type="text"
                                        placeholder="顯示名稱"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400"
                                    />
                                    <textarea
                                        rows="4"
                                        placeholder="個人簡介"
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                        className="w-full px-4 py-2 mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 resize-none"
                                    ></textarea>
                                    <div className="flex space-x-4 justify-end mt-6">
                                        <Button
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="!bg-gradient-to-r from-blue-500 to-blue-600 hover:!from-blue-600 hover:!to-blue-700 !text-white !rounded-full !px-6 !py-2 !text-sm !font-medium !shadow-lg !transition-all !duration-300 !ease-in-out !transform hover:!scale-105"
                                        >
                                            儲存變更
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancel}
                                            disabled={isLoading}
                                            className="!bg-transparent !text-gray-700 !border-2 !border-gray-300 hover:!bg-gray-100 dark:!text-gray-200 dark:!border-gray-600 dark:hover:!bg-gray-700 !rounded-full !px-6 !py-2 !text-sm !font-medium !shadow-md !transition-all !duration-300 !ease-in-out !transform hover:!scale-105"
                                        >
                                            取消編輯
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {/* 用戶資訊區塊 */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            {/* 顯示用戶名稱 */}
                                            <Typography 
                                                variant="h4" 
                                                component="h1" 
                                                className="font-bold text-gray-800 dark:text-white mb-2"
                                                sx={{ fontSize: '2.25rem' }}
                                            >
                                                {user?.displayName || '未設定名稱'}
                                            </Typography>
                                            {/* 顯示用戶電子郵件 */}
                                            <Typography 
                                                variant="body1" 
                                                className="text-gray-500 dark:text-gray-400"
                                            >
                                                {user?.email}
                                            </Typography>
                                        </div>
                                        {/* 編輯按鈕 */}
                                        <IconButton 
                                            onClick={() => setIsEditing(true)}
                                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            sx={{ 
                                                padding: '12px',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': { transform: 'scale(1.1)' }
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-gray-900 dark:text-white">
                                                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                                    <path strokeDasharray="20" strokeDashoffset="20" d="M3 21h18">
                                                        <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="20;0"/>
                                                    </path>
                                                    <path strokeDasharray="48" strokeDashoffset="48" d="M7 17v-4l10 -10l4 4l-10 10h-4">
                                                        <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.6s" values="48;0"/>
                                                    </path>
                                                    <path strokeDasharray="8" strokeDashoffset="8" d="M14 6l4 4">
                                                        <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.8s" dur="0.2s" values="8;0"/>
                                                    </path>
                                                </g>
                                            </svg>
                                        </IconButton>
                                    </div>
                                    {/* 用戶簡介區塊 */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                                        <Typography 
                                            variant="body1" 
                                            className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                        >
                                            {user?.bio || '還沒有個人簡介'}
                                        </Typography>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Divider className="my-12" />

            {/* 文章分頁 */}
            <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                className="mb-8"
                sx={{
                    '& .MuiTabs-indicator': {
                        backgroundColor: 'rgb(59, 130, 246)',
                    },
                    '& .MuiTab-root': {
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        letterSpacing: '0.5px',
                        color: 'rgb(107, 114, 128)',
                        '&.Mui-selected': {
                            color: 'rgb(59, 130, 246)',
                        },
                    },
                }}
            >
                <Tab 
                    label={`我的文章 (${posts.length})`}
                    sx={{ fontSize: '1.25rem !important' }}
                />
                <Tab 
                    label={`轉發文章 (${reposts.length})`}
                    sx={{ fontSize: '1.25rem !important' }}
                />
            </Tabs>

            <Grid container spacing={4}>
                {activeTab === 0 ? (
                    // 原創文章列表
                    posts.length > 0 ? (
                        posts.map(post => (
                            <Grid item xs={12} sm={6} md={4} key={post.id}>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    <Card
                                        className="h-full cursor-pointer hover:shadow-xl transition-all duration-300"
                                        sx={{ 
                                            borderRadius: '20px', 
                                            height: '100%', 
                                            background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                                            boxShadow: '5px 5px 15px #d1d1d1, -5px -5px 15px #ffffff'
                                        }}
                                        onClick={() => navigate(`/post/${post.id}`)}
                                    >
                                        <CardContent className="p-6">
                                            <Typography 
                                                variant="h6" 
                                                noWrap 
                                                className="font-bold text-gray-800 dark:text-white mb-3"
                                                sx={{ fontSize: '1.25rem', fontWeight: 700 }}
                                            >
                                                {post.title}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                className="text-gray-500 dark:text-gray-400 mb-3"
                                                sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}
                                            >
                                                {formatDistanceToNow(post.createdAt?.toDate(), { addSuffix: true, locale: zhTW })}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                className="text-gray-600 dark:text-gray-300 line-clamp-3"
                                                sx={{ fontSize: '1rem', lineHeight: 1.6 }}
                                            >
                                                {post.content}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Typography 
                                variant="body1" 
                                align="center" 
                                className="text-gray-500 dark:text-gray-400 py-12"
                                sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}
                            >
                                還沒有發表過文章，開始創作吧！
                            </Typography>
                        </Grid>
                    )
                ) : (
                    // 轉發文章列表
                    reposts.length > 0 ? (
                        reposts.map(post => (
                            <Grid item xs={12} sm={6} md={4} key={post.id}>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    <Card
                                        className="h-full cursor-pointer hover:shadow-xl transition-all duration-300"
                                        sx={{ 
                                            borderRadius: '20px', 
                                            height: '100%', 
                                            background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                                            boxShadow: '5px 5px 15px #d1d1d1, -5px -5px 15px #ffffff'
                                        }}
                                        onClick={() => navigate(`/post/${post.originalPostId || post.id}`)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center mb-3">
                                                <RepeatIcon 
                                                    className="mr-2 text-blue-500"
                                                    sx={{ fontSize: '1.25rem' }}
                                                />
                                                <Typography 
                                                    variant="body2"
                                                    className="text-blue-500"
                                                    sx={{ fontSize: '0.875rem' }}
                                                >
                                                    已轉發
                                                </Typography>
                                            </div>
                                            <Typography 
                                                variant="h6" 
                                                noWrap 
                                                className="font-bold text-gray-800 dark:text-white mb-3"
                                                sx={{ fontSize: '1.25rem', fontWeight: 700 }}
                                            >
                                                {post.title}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                className="text-gray-500 dark:text-gray-400 mb-3"
                                                sx={{ fontSize: '0.875rem', fontStyle: 'italic' }}
                                            >
                                                {formatDistanceToNow(post.createdAt?.toDate(), { addSuffix: true, locale: zhTW })}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                className="text-gray-600 dark:text-gray-300 line-clamp-3"
                                                sx={{ fontSize: '1rem', lineHeight: 1.6 }}
                                            >
                                                {post.content}
                                            </Typography>
                                            {post.originalAuthor && (
                                                <Typography 
                                                    variant="body2" 
                                                    className="mt-3 text-gray-500 dark:text-gray-400"
                                                    sx={{ fontSize: '0.875rem' }}
                                                >
                                                    原作者：{post.originalAuthor}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Typography 
                                variant="body1" 
                                align="center" 
                                className="text-gray-500 dark:text-gray-400 py-12"
                                sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}
                            >
                                還沒有轉發過文章
                            </Typography>
                        </Grid>
                    )
                )}
            </Grid>
        </motion.div>
    );
}

export default Profile;