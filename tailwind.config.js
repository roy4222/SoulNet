/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // ✅ 確保這行存在
  darkMode: 'class', // 啟用 class 策略的暗黑模式
  theme: {
    extend: {},
  },
  plugins: [],
};
