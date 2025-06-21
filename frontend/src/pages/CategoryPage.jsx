import React from 'react';
import ContentList from '../components/ContentList';
import './CategoryPage.css';

const CategoryPage = ({ title, contentType }) => {
  return (
    <>
      <div className="content-header">
        <h1>{title}</h1>
      </div>
      <ContentList contentType={contentType} />
    </>
  );
};

export default CategoryPage;
