// 引入頁面組件
import Sign from './pages/Sign';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import NewPost from './pages/NewPost';
import Post from './pages/Post';
import Profile from './pages/Profile';
import EditPost from './pages/EditPost';
import AdminPanel from './pages/AdminPanel';
import ResetPassword from './pages/ResetPassword';

// 定義路由路徑常量
export const ROUTES = {
    HOME: '/',
    SIGN: '/sign',
    REGISTER: '/register',
    NEW_POST: '/NewPost',
    POST_DETAIL: '/post/:id',
    EDIT_POST: '/edit-post/:id',
    PROFILE: '/profile',
    ADMIN: '/admin',
    RESET_PASSWORD: '/reset-password'
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
    },
    {
        path: ROUTES.EDIT_POST,
        element: EditPost,
        title: '編輯文章'
    },
    {
        path: ROUTES.PROFILE,
        element: Profile,
        title: '個人資料'
    },
    {
        path: ROUTES.ADMIN,
        element: AdminPanel,
        title: '管理員面板'
    },
    {
        path: ROUTES.RESET_PASSWORD,
        element: ResetPassword,
        title: '重設密碼'
    }
];

// 導出所有路由配置
export default routes;
