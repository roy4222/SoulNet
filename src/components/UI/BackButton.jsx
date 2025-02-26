import React from 'react';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// BackButton 組件：返回按鈕
function BackButton({ navigate }) {
  return (
    <motion.button
      onClick={() => navigate(-1)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="mb-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
    >
      <ArrowBackIcon className="w-5 h-5" />
    </motion.button>
  );
}

export default BackButton;
