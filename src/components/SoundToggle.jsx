import { useState, useEffect, useRef } from 'react';
import { playSwitch, playClick, playHover, useAudioConfig } from '../hooks/useSound';

function SoundToggle() {
  const [config, setConfig] = useAudioConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMaster = () => {
    setConfig({ soundEnabled: !config.soundEnabled });
    playSwitch();
  };

  const toggleMusic = () => {
    setConfig({ musicEnabled: !config.musicEnabled });
    playClick();
  };

  const toggleSFX = () => {
    setConfig({ sfxEnabled: !config.sfxEnabled });
    playClick();
  };

  const isMasterOn = config.soundEnabled;
  const isMusicOn = config.musicEnabled;
  const isSFXOn = config.sfxEnabled;

  return (
    <div className="sound-widget-container" ref={containerRef}>
      {menuOpen && (
        <div className="sound-control-panel">
          <div className="panel-header">
            <span className="panel-title">Audio Settings</span>
          </div>
          <div className="control-rows">
            <div className="control-row">
              <span className="control-label">Master Sound</span>
              <button
                className={`switch-control ${isMasterOn ? 'active' : ''}`}
                onClick={toggleMaster}
                aria-label="Toggle Master Audio"
              >
                <span className="switch-slider"></span>
              </button>
            </div>
            <div className="control-row">
              <span className="control-label">Ambient Theme</span>
              <button
                className={`switch-control ${isMusicOn ? 'active' : ''}`}
                onClick={toggleMusic}
                disabled={!isMasterOn}
                aria-label="Toggle Ambient Theme"
              >
                <span className="switch-slider"></span>
              </button>
            </div>
            <div className="control-row">
              <span className="control-label">Sound Effects</span>
              <button
                className={`switch-control ${isSFXOn ? 'active' : ''}`}
                onClick={toggleSFX}
                disabled={!isMasterOn}
                aria-label="Toggle Sound Effects"
              >
                <span className="switch-slider"></span>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        className={`floating-sound-toggle ${menuOpen ? 'active' : ''}`}
        onClick={() => { setMenuOpen(!menuOpen); playClick(); }}
        onMouseEnter={playHover}
        aria-label="Audio controls"
      >
        <span className="icon-wrap">
          {!isMasterOn || (!isMusicOn && !isSFXOn) ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="playing-waves">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="wave-inner"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="wave-outer"></path>
            </svg>
          )}
        </span>
      </button>

      <style>{`
        .sound-widget-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .floating-sound-toggle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background-color: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          color: #000000;
          outline: none;
        }
        .floating-sound-toggle:hover,
        .floating-sound-toggle.active {
          transform: scale(1.08);
          background-color: #000000;
          color: #ffffff;
          border-color: #000000;
          box-shadow: 0 6px 22px rgba(0, 0, 0, 0.25);
        }
        .floating-sound-toggle .icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes sound-wave-pulse {
          0% { opacity: 0.35; }
          50% { opacity: 1; }
          100% { opacity: 0.35; }
        }
        .playing-waves .wave-inner {
          animation: sound-wave-pulse 1.2s ease-in-out infinite;
        }
        .playing-waves .wave-outer {
          animation: sound-wave-pulse 1.2s ease-in-out infinite;
          animation-delay: 0.3s;
        }
        .sound-control-panel {
          position: absolute;
          bottom: 72px;
          right: 0;
          width: 220px;
          background: rgba(15, 15, 17, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.4);
          border-radius: 16px;
          padding: 16px;
          color: #ffffff;
          animation: popoverFadeIn 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: bottom right;
        }
        @keyframes popoverFadeIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .panel-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .panel-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: rgba(255, 255, 255, 0.5);
        }
        .control-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 600;
        }
        .control-row .control-label {
          color: #f4f4f5;
        }
        .switch-control {
          position: relative;
          width: 38px;
          height: 20px;
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 99px;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s;
          padding: 0;
          outline: none;
        }
        .switch-control[disabled] {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .switch-control.active {
          background-color: #0af9cf;
        }
        .switch-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: #ffffff;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .switch-control.active .switch-slider {
          transform: translateX(18px);
        }
        @media (max-width: 767px) {
          .sound-widget-container {
            bottom: 20px;
            right: 20px;
          }
          .floating-sound-toggle {
            width: 46px;
            height: 46px;
          }
          .sound-control-panel {
            bottom: 60px;
          }
        }
      `}</style>
    </div>
  );
}

export default SoundToggle;
