import './PlaceholderPage.css';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="placeholder-page">
      <h2>{title}</h2>
      <p className="placeholder-text">Эта страница находится в разработке</p>
      <div className="placeholder-content">
        <div className="placeholder-box"></div>
        <div className="placeholder-box"></div>
        <div className="placeholder-box"></div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
