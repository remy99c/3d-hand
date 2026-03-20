import React from 'react'

interface IntroPopupProps {
  onEnter: () => void
}

export const IntroPopup: React.FC<IntroPopupProps> = ({ onEnter }) => {
  return (
    <div className="intro-overlay">
      <div className="intro-popup">
        <button className="close-popup" onClick={onEnter} aria-label="Close popup">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <header className="intro-header">
          <h2 className="intro-title">UNA VEZ MÁS — REIMAGINED</h2>
        </header>
        
        <div className="intro-content">
          <p className="intro-text-italic">
            This work reimagines protest as a relational gesture. It does not exist alone. 
            It emerges through collective presence, friction, and participation.
          </p>
          
          <p className="intro-text-main">
            The sculpture responds to your engagement. Click, touch, move — each interaction 
            feeds the collective force. If participation fades, the gesture contracts, loses 
            texture, becomes fragile. Resistance is not autonomous. It depends on the 
            unstable relation between body, code, system, and audience.
          </p>
          
          <footer className="intro-footer">
            <p className="artist-credit">AFTER REGINA SILVEIRA · 2026</p>
          </footer>
          
          <button className="enter-button" onClick={onEnter}>
            ENTER THE WORK <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
