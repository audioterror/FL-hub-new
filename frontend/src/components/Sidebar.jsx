import { NavLink, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaLayerGroup,
  FaBolt,
  FaFont,
  FaMusic,
  FaFilm,
  FaPenNib,
  FaBox,
  FaUsers,
  FaCode,
  FaShieldAlt,
  FaCrown
} from 'react-icons/fa';
import MiniProfile from './MiniProfile';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Определяем роли пользователя
  const isAdmin = user && ['ADMIN', 'CEO'].includes(user.role);
  const isCEO = user && user.role === 'CEO';

  // Основные пункты меню
  const navItems = [
    { path: '/', name: 'Главное', icon: <FaHome /> },
    { path: '/presets', name: 'Пресеты', icon: <FaLayerGroup /> },
    { path: '/plugins', name: 'Плагины', icon: <FaBolt /> },
    { path: '/fonts', name: 'Шрифты', icon: <FaFont /> },
    { path: '/sounds', name: 'Звуки', icon: <FaMusic /> },
    { path: '/footage', name: 'Футажи', icon: <FaFilm /> },
    { path: '/scripts', name: 'Скрипты', icon: <FaCode /> },
    { path: '/graphics', name: 'Графика', icon: <FaPenNib /> },
    { path: '/packs', name: 'Паки', icon: <FaBox /> },
    { path: '/community', name: 'Сообщество', icon: <FaUsers /> },
  ];

  // Пункты меню для администраторов
  const adminItems = [
    { path: '/admin', name: 'Администрирование', icon: <FaShieldAlt /> },
  ];

  // Пункты меню для CEO
  const ceoItems = [
    { path: '/ceo', name: 'Управление', icon: <FaCrown /> },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">
          <span>FL</span>
          <div className="hub">hub</div>
        </div>
      </div>

      <nav className="nav-menu">
        <ul>
          {/* Основные пункты меню */}
          {navItems.map((item) => (
            <li key={item.path} className={currentPath === item.path ? 'active' : ''}>
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'active-link' : ''}
                end={item.path === '/'}
              >
                <i>{item.icon}</i> {item.name}
              </NavLink>
            </li>
          ))}

          {/* Пункты меню для администраторов */}
          {isAdmin && adminItems.map((item) => (
            <li key={item.path} className={currentPath === item.path ? 'active' : ''}>
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'active-link' : ''}
              >
                <i>{item.icon}</i> {item.name}
              </NavLink>
            </li>
          ))}

          {/* Пункты меню для CEO */}
          {isCEO && ceoItems.map((item) => (
            <li key={item.path} className={currentPath === item.path ? 'active' : ''}>
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'active-link' : ''}
              >
                <i>{item.icon}</i> {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <MiniProfile user={user} onLogout={onLogout} />
        <div className="version">FL Hub v0.1.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;
