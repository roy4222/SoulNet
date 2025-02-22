// 引入頁面組件
import Sign from './pages/Sign';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import NewPost from './pages/NewPost';
import Post from './pages/Post';

// 定義路由路徑常量
export const ROUTES = {
    HOME: '/',
    SIGN: '/sign',
    REGISTER: '/register',
    NEW_POST: '/NewPost',
    POST_DETAIL: '/post/:id'
};

// 定義路由配置
export const routes = [
    {
        path: ROUTES.HOME,
        element: HomePage,
        title: '首頁'
    },
    {
        path: ROUTES.SIGN,
        element: Sign,
        title: '登入'
    },
    {
        path: ROUTES.REGISTER,
        element: Register,
        title: '註冊'
    },
    {
        path: ROUTES.NEW_POST,
        element: NewPost,
        title: '發表文章'
    },
    {
        path: ROUTES.POST_DETAIL,
        element: Post,
        title: '文章詳情'
    }
];

// 導出所有路由配置
export default routes;
