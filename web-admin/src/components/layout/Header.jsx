import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title }) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-500 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-700">{user?.name}</p>
              <p className="text-xs text-slate-500">
                {user?.role === 'ADMIN' ? 'Administrador' : 
                 user?.role === 'MANAGER' ? 'Síndico' : 'Zelador'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
