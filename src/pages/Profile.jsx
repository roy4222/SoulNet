// 引入必要的 React 函式和組件
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, auth, storage } from '../utils/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
    const [editForm, setEditForm] = useState({  // 儲存編輯表單的資料
        displayName: '',
        bio: '',
        avatar: null
    });
    const [activeTab, setActiveTab] = useState(0);  // 儲存目前的分頁索引

    // 使用 useEffect 鉤子在組件載入時獲取用戶資料
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // 獲取當前登入的用戶
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    navigate('/sign');  // 如果沒有登入，導向登入頁面
                    return;
                }

                // 從 Firestore 獲取用戶資料
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    // 設置用戶資料和編輯表單的初始值
                    setUser({
                        ...currentUser,
                        ...userDoc.data()
                    });
                    setEditForm({
                        displayName: currentUser.displayName || '',
                        bio: userDoc.data().bio || '',
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

    // 處理頭像上傳
    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setEditForm(prev => ({ ...prev, avatar: file }));
        }
    };

    // 處理表單提交
    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const currentUser = auth.currentUser;

            // 如果有新頭像，先上傳到 Firebase Storage
            let avatarUrl = user.photoURL;
            if (editForm.avatar) {
                const avatarRef = ref(storage, `avatars/${currentUser.uid}`);
                await uploadBytes(avatarRef, editForm.avatar);
                avatarUrl = await getDownloadURL(avatarRef);
            }

            // 更新 Firebase Auth 資料
            await updateProfile(currentUser, {
                displayName: editForm.displayName,
                photoURL: avatarUrl
            });

            // 更新 Firestore 資料
            await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: editForm.displayName,
                bio: editForm.bio,
                photoURL: avatarUrl,
                updatedAt: new Date()
            });

            // 更新本地狀態
            setUser(prev => ({
                ...prev,
                displayName: editForm.displayName,
                photoURL: avatarUrl,
                bio: editForm.bio
            }));

            setIsEditing(false);
            setIsLoading(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('更新資料時發生錯誤');
            setIsLoading(false);
        }
    };

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
                                    src={user?.photoURL || DEFAULT_AVATAR}
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
                                            onClick={() => setIsEditing(false)}
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