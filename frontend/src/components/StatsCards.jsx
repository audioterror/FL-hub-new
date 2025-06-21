import React from 'react';
import { FaUsers, FaUserTie, FaUserShield, FaUserTag, FaFileAlt } from 'react-icons/fa';
import './StatsCards.css';

/**
 * Компонент для отображения статистики в виде карточек
 * @param {Object} props - Свойства компонента
 * @param {Object} props.usersStats - Статистика пользователей
 * @param {number} props.contentCount - Количество контента
 * @returns {React.ReactNode}
 */
const StatsCards = ({ usersStats, contentCount }) => {
  return (
    <div className="stats-cards">
      <div className="stats-card">
        <div className="stats-card-icon">
          <FaUsers />
        </div>
        <div className="stats-card-content">
          <h3>Всего пользователей</h3>
          <div className="stats-card-value">{usersStats.total}</div>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="stats-card-icon">
          <FaUserTag />
        </div>
        <div className="stats-card-content">
          <h3>BASIC</h3>
          <div className="stats-card-value">{usersStats.basic}</div>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="stats-card-icon">
          <FaUserTie />
        </div>
        <div className="stats-card-content">
          <h3>VIP</h3>
          <div className="stats-card-value">{usersStats.vip}</div>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="stats-card-icon">
          <FaUserShield />
        </div>
        <div className="stats-card-content">
          <h3>ADMIN</h3>
          <div className="stats-card-value">{usersStats.admin}</div>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="stats-card-icon">
          <FaFileAlt />
        </div>
        <div className="stats-card-content">
          <h3>Всего материалов</h3>
          <div className="stats-card-value">{contentCount}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
