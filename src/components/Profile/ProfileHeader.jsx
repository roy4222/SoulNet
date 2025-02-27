import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, Button, IconButton, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageIcon from '@mui/icons-material/Image';

// 定義預設頭像URL
const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCvBNjFR_6BVhW3lFNwF0oEk2N8JXjeiaSqg&s';

// ProfileHeader 組件：顯示用戶資料和編輯功能
function ProfileHeader({ 
  user,                // 用戶資料
  isEditing,           // 是否處於編輯模式
  imagePreview,        // 頭像預覽
  editForm,            // 編輯表單資料
  isLoading,           // 加載狀態
  setEditForm,         // 設置編輯表單資料的函數
  setIsEditing,        // 設置編輯模式的函數
  handleSubmit,        // 提交編輯的處理函數
  handleAvatarChange,  // 更改頭像的處理函數
  handleCancel         // 取消編輯的處理函數
}) {
  return (
    // 使用 framer-motion 創建動畫效果
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8">
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
                // 編輯模式下的表單
                <div className="space-y-6">
                  {/* 顯示名稱輸入框 */}
                  <input
                    type="text"
                    placeholder="顯示名稱"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400"
                  />
                  {/* 個人簡介輸入框 */}
                  <textarea
                    rows="4"
                    placeholder="個人簡介"
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-2 mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 resize-none"
                  ></textarea>
                  {/* 保存和取消按鈕 */}
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
                // 非編輯模式下的用戶資訊顯示
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
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileHeader;
