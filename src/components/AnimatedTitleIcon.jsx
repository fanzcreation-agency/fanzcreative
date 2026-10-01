import { useEffect, useRef, useState } from 'react';

function AnimatedTitleIcon({ className = '', style = {} }) {
  const [fallingCards, setFallingCards] = useState([]);
  const cardCounter = useRef(0);
  const typeCounter = useRef(0);

  useEffect(() => {
    const spawnCard = () => {
      const id = cardCounter.current++;
      const type = (typeCounter.current % 3) + 1;
      typeCounter.current++;
      const left = Math.floor(Math.random() * 100) + 15;
      const rotate = Math.floor(Math.random() * 24) - 12;
      const scale = 0.9 + Math.random() * 0.15;

      const newCard = { id, type, left, rotate, scale };
      setFallingCards(prev => [...prev, newCard]);

      setTimeout(() => {
        setFallingCards(prev => prev.filter(c => c.id !== id));
      }, 3400);
    };

    spawnCard();
    const interval = setInterval(spawnCard, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`title-icon animated-title-icon ${className}`} style={style}>
      <style>{`
        .animated-title-icon {
          position: relative;
          width: 255px;
          height: 80px;
          display: inline-block;
          vertical-align: middle;
          margin-left: 16px;
          z-index: 1;
        }
        .animated-title-icon .box {
          position: relative;
          z-index: 2;
          display: flex;
          width: 255px;
          height: 80px;
          border-radius: 999px;
          background: linear-gradient(135deg, #0af9cf 0%, #7ef716 100%);
          box-shadow: 0px 3.44px 5.57px 0px rgba(0,0,0,0.09),
                      0px 22.91px 37.08px 0px rgba(10,249,207,0.25),
                      0px 56px 83px 0px rgba(126,247,22,0.3),
                      0px 14px 34px 0px rgba(10,249,207,0.3),
                      0px 1px 2px 0px rgba(126,247,22,0.4);
        }
        .animated-title-icon .hero-shape-flight-zone {
          position: absolute;
          z-index: 3;
          top: 0;
          left: 0;
          width: 255px;
          height: 180px;
          overflow: hidden;
          pointer-events: none;
        }
        .animated-title-icon .hero-falling-shape {
          position: absolute;
          will-change: transform, opacity;
          animation: heroShapeFallSequential 3.2s linear forwards;
        }
        .animated-title-icon .hero-falling-shape img {
          position: absolute;
          top: 0;
          left: 0;
          width: auto;
          max-width: none;
        }
        @keyframes heroShapeFallSequential {
          0% {
            transform: translate3d(0, -140px, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 180px, 0);
            opacity: 0;
          }
        }
      `}</style>
      <div className="box"></div>
      <div className="hero-shape-flight-zone" aria-hidden="true">
        {fallingCards.map((card) => {
          const imgSrc = `/assets/images/item/hero-${card.type}.svg`;
          return (
            <div
              key={card.id}
              className="hero-falling-shape"
              style={{
                left: `${card.left}px`,
                transformOrigin: 'center center',
              }}
            >
              <img loading="lazy"
                src={imgSrc}
                alt=""
                style={{
                  transform: `rotate(${card.rotate}deg) scale(${card.scale})`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnimatedTitleIcon;
