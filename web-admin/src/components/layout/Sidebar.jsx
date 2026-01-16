import { NavLink } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Building, 
  Users, 
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/'
  },
  {
    title: 'Unidades',
    icon: Building,
    submenu: [
      { title: 'Condomínios', path: '/units/condominiums' },
      { title: 'Blocos', path: '/units/blocks' },
      { title: 'Apartamentos', path: '/units/apartments' }
    ]
  },
  {
    title: 'Usuários',
    icon: Users,
    submenu: [
      { title: 'Todos os Usuários', path: '/users' },
      { title: 'Moradores', path: '/users/residents' },
      { title: 'Zeladores', path: '/users/janitors' }
    ]
  },
  {
    title: 'Comunicados',
    icon: MessageSquare,
    path: '/announcements'
  },
  {
    title: 'Configurações',
    icon: Settings,
    path: '/settings'
  }
];

function MenuItem({ item }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  if (item.submenu) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-slate-300 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span>{item.title}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="ml-8 mt-1 space-y-1">
            {item.submenu.map((subItem) => (
              <NavLink
                key={subItem.path}
                to={subItem.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400'
                  }`
                }
              >
                {subItem.title}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-300'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span>{item.title}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">InterfoneApp</h1>
            <p className="text-xs text-slate-500">Painel Admin</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <MenuItem key={item.title} item={item} />
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
