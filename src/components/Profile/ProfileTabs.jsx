import React from 'react';
import { Tabs, Tab, Divider } from '@mui/material';

function ProfileTabs({ activeTab, handleTabChange, postsCount, repostsCount }) {
  return (
    <>
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
          label={`我的文章 (${postsCount})`}
          sx={{ fontSize: '1.25rem !important' }}
        />
        <Tab 
          label={`轉發文章 (${repostsCount})`}
          sx={{ fontSize: '1.25rem !important' }}
        />
      </Tabs>
    </>
  );
}

export default ProfileTabs;
