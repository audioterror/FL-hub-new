import React, { createContext, useState, useContext } from 'react';

// Создаем контекст для поиска
const SearchContext = createContext();

// Хук для использования контекста поиска
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

// Провайдер контекста поиска
export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Функция для обновления поискового запроса
  const updateSearchQuery = (query) => {
    setSearchQuery(query);
  };

  // Функция для очистки поискового запроса
  const clearSearchQuery = () => {
    setSearchQuery('');
  };

  // Значение контекста
  const value = {
    searchQuery,
    updateSearchQuery,
    clearSearchQuery
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;
