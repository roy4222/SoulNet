import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// SuccessMessage 組件：顯示成功提示訊息
function SuccessMessage({ show, message = '訊息傳送成功！' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SuccessMessage;
