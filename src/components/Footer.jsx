import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaGithub, FaHeart } from 'react-icons/fa';

// Footer 組件：網站的底部區域
function Footer() {
  return (
    // 頁腳容器，使用漸變背景和內邊距，根據螢幕尺寸調整padding
    <footer className="bg-gradient-to-r from-indigo-900 to-purple-900 dark:bg-gray-900 text-white py-8 sm:py-10 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 使用網格布局，在不同螢幕尺寸下調整列數 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* 品牌區域：在所有尺寸下置中，在大螢幕時左對齊 */}
          <div className="text-center lg:text-left space-y-3">
            {/* 網站名稱，使用漸變文字效果，響應式字體大小 */}
            <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-indigo-300 dark:text-gray-200 mb-2">
            SoulNet
            </h3>
            {/* 網站簡介，根據螢幕尺寸調整字體大小 */}
            <p className="text-sm sm:text-base text-indigo-200 dark:text-gray-400">
              讓我們連結每一個精彩時刻
            </p>
            {/* 版權信息 */}
            <p className="text-xs sm:text-sm text-indigo-200 dark:text-gray-400 mt-4">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          {/* 快速連結：在所有尺寸下置中 */}
          <div className="text-center space-y-4">
            <h4 className="text-lg font-semibold text-indigo-300 dark:text-gray-300 mb-4">快速連結</h4>
            {/* 連結列表，增加點擊區域和間距 */}
            <ul className="space-y-3 sm:space-y-2">
              <li>
                <a 
                  href="/about" 
                  className="block sm:inline-block py-2 sm:py-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transition duration-300"
                >
                  關於我們
                </a>
              </li>
              <li>
                <a 
                  href="/privacy" 
                  className="block sm:inline-block py-2 sm:py-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transition duration-300"
                >
                  隱私政策
                </a>
              </li>
              <li>
                <a 
                  href="/terms" 
                  className="block sm:inline-block py-2 sm:py-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transition duration-300"
                >
                  服務條款
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  className="block sm:inline-block py-2 sm:py-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transition duration-300"
                >
                  聯絡我們
                </a>
              </li>
            </ul>
          </div>

          {/* 社群媒體：在手機版置中，在大螢幕時右對齊 */}
          <div className="text-center lg:text-right space-y-4">
            <h4 className="text-lg font-semibold text-indigo-300 dark:text-gray-300 mb-4">關注我們</h4>
            {/* 社群媒體圖標，增加間距和觸摸區域 */}
            <div className="flex justify-center lg:justify-end space-x-6 sm:space-x-4">
              {/* Facebook 連結 */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 sm:p-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transform hover:scale-110 transition duration-300"
              >
                <FaFacebook className="w-6 h-6 sm:w-5 sm:h-5" />
              </a>
              {/* Twitter 連結 */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transform hover:scale-110 transition duration-300"
              >
                <FaTwitter className="w-6 h-6 sm:w-5 sm:h-5" />
              </a>
              {/* Instagram 連結 */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transform hover:scale-110 transition duration-300"
              >
                <FaInstagram className="w-6 h-6 sm:w-5 sm:h-5" />
              </a>
              {/* GitHub 連結 */}
              <a 
                href="https://github.com/roy4222" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-1 text-indigo-200 dark:text-gray-400 hover:text-pink-300 dark:hover:text-gray-300 transform hover:scale-110 transition duration-300"
              >
                <FaGithub className="w-6 h-6 sm:w-5 sm:h-5" />
              </a>
            </div>
            {/* 製作信息，優化對齊方式 */}
            <div className="flex items-center justify-center lg:justify-end mt-6 text-sm text-indigo-200 dark:text-gray-400">
              <span className="whitespace-nowrap">Made with</span>
              <FaHeart className="mx-2 text-pink-400 dark:text-gray-300 animate-pulse" />
              <span className="whitespace-nowrap">in Taiwan</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
