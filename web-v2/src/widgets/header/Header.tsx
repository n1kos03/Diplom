import { Link } from "react-router-dom";

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
    const isLoggedIn = !!localStorage.getItem('access_token');
    const user = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
    
    return (
      <header className="w-full flex items-center justify-between px-4 sm:px-8 py-4 bg-white/80 backdrop-blur border-b border-gray-100 z-50 h-16">
        <div className="font-bold text-xl text-blue-700 tracking-tight">nikitosik</div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link to={`/user/${user?.user?.id}`} className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium">{user?.user?.nickname}</span>
              <Avatar alt={user?.user?.nickname} size={36} />
            </Link>
          ) : (
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow">Login</button>
          )}
        </div>
      </header>
    )
  }