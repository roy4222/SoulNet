import React from 'react';
import { Tabs, Tab, Divider } from '@mui/material';

function ProfileTabs({ activeTab, handleTabChange, postsCount, repostsCount, theme }) {
  // 確保 postsCount 和 repostsCount 是有效的數字
  const safePostsCount = typeof postsCount === 'number' ? postsCount : 0;
  const safeRepostsCount = typeof repostsCount === 'number' ? repostsCount : 0;
  
  console.log('ProfileTabs - 文章數量:', safePostsCount);
  console.log('ProfileTabs - 轉發數量:', safeRepostsCount);

  return (
    <>
      <Divider className="my-12 dark:border-gray-700" />
      
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
            color: theme?.palette.mode === 'dark' ? 'rgb(209, 213, 219)' : 'rgb(107, 114, 128)',
            '&.Mui-selected': {
              color: 'rgb(59, 130, 246)',
            },
          },
        }}
      >
        <Tab 
          label={`我的文章 (${safePostsCount})`}
          sx={{ fontSize: '1.25rem !important' }}
          data-testid="my-posts-tab"
        />
        <Tab 
          label={`轉發文章 (${safeRepostsCount})`}
          sx={{ fontSize: '1.25rem !important' }}
          data-testid="reposted-posts-tab"
        />
      </Tabs>
    </>
  );
}

export default ProfileTabs;
