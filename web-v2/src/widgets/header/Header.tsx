import { Link, useNavigate } from "react-router-dom";

const Avatar = ({ alt, size = 32 }: { alt: string; size?: number }) => {
    const px = `${size}px`;
    return (
        <div
            className="rounded-full border-4 border-white overflow-hidden bg-gray-200 flex items-center justify-center font-bold select-none"
            style={{ width: px, height: px, fontSize: size / 2 }}
        >
            {alt?.[0]?.toUpperCase() || "?"}
        </div>
    )
}

export const Header = () => {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('access_token');
    const user = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
    
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/auth');
    };
    
    return (
      <header className="w-full flex items-center justify-between px-4 sm:px-8 py-4 bg-white/80 backdrop-blur border-b border-gray-100 z-50 h-16">
        <div className="font-bold text-xl text-blue-700 tracking-tight">ArtCourse</div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link to={`/user/${user?.user?.id}`} className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium">{user?.user?.nickname}</span>
                <Avatar alt={user?.user?.nickname} size={36} />
              </Link>
              <button 
                onClick={handleLogout}
                className="cursor-pointer ml-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Выйти
              </button>
            </>
          ) : (
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow">Войти</button>
          )}
        </div>
      </header>
    )
  }