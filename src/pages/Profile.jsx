// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, auth, storage } from '../utils/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Avatar, Button, TextField, IconButton, CircularProgress, Card, CardContent, Typography, Grid, Divider, Tabs, Tab } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
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
            
            if (!endpoint) {
                throw new Error('未設定 R2 Endpoint (VITE_R2_ENDPOINT)');
            }
            
            if (!bucket) {
                throw new Error('未設定 R2 Bucket (VITE_R2_BUCKET)');
            }
            
            console.log('開始更新用戶資料...');

            // 如果有新頭像，先上傳到 Cloudflare R2
            let avatarUrl = user?.photoURL || DEFAULT_AVATAR;
            if (editForm.avatar) {
                console.log('開始上傳頭像到 R2...');
                try {
                    const fileExtension = editForm.avatar.name.split('.').pop();
                    const timestamp = Date.now();
                    const randomString = Math.random().toString(36).substring(2, 8);
                    const fileName = `avatars/${currentUser.uid}_${timestamp}_${randomString}.${fileExtension}`;
                    
                    // 將File轉換為ArrayBuffer
                    const buffer = await editForm.avatar.arrayBuffer();
                    
                    console.log('準備上傳到 R2...', {
                        bucket: bucket,
                        fileName: fileName,
                        contentType: editForm.avatar.type
                    });
                    
                    // 上傳到 R2
                    await r2Client.send(new PutObjectCommand({
                        Bucket: bucket,
                        Key: fileName,
                        Body: buffer,
                        ContentType: editForm.avatar.type,
                        CacheControl: 'no-cache',
                    }));
                    
                    console.log('頭像上傳成功');
                    // 構建 R2 URL
                    const publicUrl = `https://${endpoint}/${fileName}`;
                    avatarUrl = publicUrl;
                    console.log('取得頭像 URL:', avatarUrl);

                    // 刪除舊的頭像
                    if (user?.photoURL && user.photoURL !== DEFAULT_AVATAR) {
                        try {
                            const oldFileName = user.photoURL.split('/').pop();
                            if (oldFileName.startsWith('avatars/')) {
                                await r2Client.send(new DeleteObjectCommand({
                                    Bucket: bucket,
                                    Key: oldFileName
                                }));
                                console.log('舊頭像刪除成功');
                            }
                        } catch (err) {
                            console.error('刪除舊頭像時發生錯誤:', err);
                            // 不中斷流程，繼續執行
                        }
                    }
                } catch (err) {
                    console.error('上傳頭像時發生錯誤:', err);
                    throw new Error('上傳頭像失敗: ' + err.message);
                }
            }

            // 更新 Firebase Auth 資料
            console.log('更新 Auth 資料...');
            try {
                await updateProfile(currentUser, {
                    displayName: editForm.displayName,
                    photoURL: avatarUrl
                });
                console.log('Auth 資料更新成功');

                // 重新載入用戶資料
                await currentUser.reload();
                const freshUser = auth.currentUser;
                
                // 確保 localStorage 同步更新
                const userData = {
                    uid: freshUser.uid,
                    email: freshUser.email,
                    displayName: freshUser.displayName,
                    photoURL: freshUser.photoURL
                };
                localStorage.setItem('social:user', JSON.stringify(userData));
                
            } catch (err) {
                console.error('更新 Auth 資料時發生錯誤:', err);
                throw new Error('更新用戶資料失敗: ' + err.message);
            }

            // 更新 Firestore 資料
            console.log('更新 Firestore 資料...');
            try {
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    displayName: editForm.displayName,
                    bio: editForm.bio,
                    photoURL: avatarUrl,
                    updatedAt: new Date()
                });
                console.log('Firestore 資料更新成功');
            } catch (err) {
                console.error('更新 Firestore 資料時發生錯誤:', err);
                throw new Error('更新用戶資料失敗: ' + err.message);
            }

            // 更新本地狀態
            setUser(prev => ({
                ...prev,
                displayName: editForm.displayName,
                photoURL: avatarUrl,
                bio: editForm.bio
            }));

            // 清除預覽和編輯狀態
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
                setImagePreview(null);
            }
            setIsEditing(false);
            setIsLoading(false);

            // 觸發 auth 狀態變化
            const authEvent = new CustomEvent('auth-state-changed', {
                detail: { user: auth.currentUser }
            });
            window.dispatchEvent(authEvent);

            console.log('用戶資料更新完成');
        } catch (err) {
            console.error('更新個人資料時發生錯誤:', err);
            setError(err.message || '更新資料時發生錯誤');
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

                // 從 Firestore 獲取用戶資料
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = {
                        ...currentUser,
                        ...userDoc.data()
                    };
                    // 確保有預設值
                    userData.photoURL = userData.photoURL || DEFAULT_AVATAR;
                    userData.displayName = userData.displayName || '未設定名稱';
                    userData.bio = userData.bio || '';
                    
                    setUser(userData);
                    setEditForm({
                        displayName: userData.displayName,
                        bio: userData.bio || '',
                        avatar: null
                    });
                } else {
                    // 如果用戶文檔不存在，創建一個新的
                    const newUserData = {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || '未設定名稱',
                        photoURL: currentUser.photoURL || DEFAULT_AVATAR,
                        bio: '',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    await setDoc(doc(db, 'users', currentUser.uid), newUserData);
                    setUser(newUserData);
                    setEditForm({
                        displayName: newUserData.displayName,
                        bio: '',
                        avatar: null
                    });
                }

                // 載入用戶的原創文章
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('authorId', '==', currentUser.uid),
                    where('isRepost', '==', false)
                );
                const postsSnapshot = await getDocs(postsQuery);
                const postsData = postsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 在前端進行排序（按創建時間降序）
                postsData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
                setPosts(postsData);

                // 載入用戶的轉發文章
                const repostsQuery = query(
                    collection(db, 'posts'),
                    where('authorId', '==', currentUser.uid),
                    where('isRepost', '==', true)
                );
                const repostsSnapshot = await getDocs(repostsQuery);
                const repostsData = repostsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 在前端進行排序（按創建時間降序）
                repostsData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
                setReposts(repostsData);

                setIsLoading(false);
            } catch (err) {
                console.error('Error loading user data:', err);
                setError('載入資料時發生錯誤');
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
                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="avatar-upload"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
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
                                    <TextField
                                        fullWidth
                                        label="顯示名稱"
                                        variant="outlined"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'white',
                                                borderRadius: '12px',
                                                '&:hover fieldset': {
                                                    borderColor: 'rgb(59, 130, 246)'
                                                }
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="個人簡介"
                                        variant="outlined"
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'white',
                                                borderRadius: '12px',
                                                '&:hover fieldset': {
                                                    borderColor: 'rgb(59, 130, 246)'
                                                }
                                            }
                                        }}
                                    />
                                    <div className="flex space-x-3 justify-end">
                                        <Button
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            sx={{
                                                backgroundColor: 'rgb(59, 130, 246)',
                                                '&:hover': {
                                                    backgroundColor: 'rgb(37, 99, 235)'
                                                },
                                                borderRadius: '10px',
                                                textTransform: 'none',
                                                padding: '8px 24px'
                                            }}
                                        >
                                            儲存
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancel}
                                            disabled={isLoading}
                                            sx={{
                                                borderColor: 'rgb(209, 213, 219)',
                                                color: 'rgb(55, 65, 81)',
                                                '&:hover': {
                                                    borderColor: 'rgb(156, 163, 175)',
                                                    backgroundColor: 'rgba(243, 244, 246, 0.1)'
                                                },
                                                borderRadius: '10px',
                                                textTransform: 'none',
                                                padding: '8px 24px'
                                            }}
                                        >
                                            取消
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <Typography 
                                                variant="h4" 
                                                component="h1" 
                                                className="font-bold text-gray-800 dark:text-white mb-2"
                                                sx={{ fontSize: '2.25rem' }}
                                            >
                                                {user?.displayName || '未設定名稱'}
                                            </Typography>
                                            <Typography 
                                                variant="body1" 
                                                className="text-gray-500 dark:text-gray-400"
                                            >
                                                {user?.email}
                                            </Typography>
                                        </div>
                                        <IconButton 
                                            onClick={() => setIsEditing(true)} 
                                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            sx={{
                                                padding: '12px',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': { transform: 'scale(1.1)' }
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </div>
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