const fs = require('fs');
const style = `
/* ADDITIONAL ABOUT PAGE STYLES */
.about-page {
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.about-hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #4a1e0e, #6b2f1a);
  color: white;
  border-radius: 18px;
  margin-top: 16px;
  box-shadow: 0 10px 30px rgba(74, 30, 14, 0.2);
}

.about-hero .page-title {
  color: #fdf7eb;
  margin-bottom: 12px;
  font-size: 36px;
}

.about-subtitle {
  font-size: 18px;
  opacity: 0.9;
  font-weight: 300;
}

.story-container {
  display: flex;
  flex-wrap: wrap;
  background: #fdf7eb;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e0cfb3;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.story-text {
  flex: 1 1 400px;
  padding: 40px;
}

.story-text h3 {
  font-size: 26px;
  color: #4a1e0e;
  margin-bottom: 20px;
}

.story-text p {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 16px;
  color: #555;
}

.story-image {
  flex: 1 1 300px;
  background-size: cover;
  background-position: center;
  min-height: 300px;
}

.gallery-desc {
  text-align: center;
  margin-bottom: 30px;
  color: #8b5a2b;
  font-size: 15px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;
}

.media-card {
  position: relative;
  height: 250px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: #000;
}

.media-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.media-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-bg {
  background-size: cover;
  background-position: center;
}

.media-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  padding: 20px;
  display: flex;
  align-items: flex-end;
}

.media-caption {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  margin: 0;
}
`;

fs.appendFileSync('c:/Users/choud/OneDrive/Документы/Desktop/SEM VI Project/FULLSTACT_WEBSITE/frontend/src/index.css', style);
console.log('Appended About Page styles successfully.');
