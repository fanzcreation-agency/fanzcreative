import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="section-404 flat-spacing">
          <div className="glow-blur-orb"></div>
          <div className="container text-center">
            <h1 className="title fw-semibold text-display-1 text-gradient-1">
              Something went wrong
            </h1>
            <p className="desc text-body-1 text-white-64">
              An unexpected error occurred. Please try refreshing the page.
            </p>
          </div>
          <style>{`
            .section-404 {
              padding: 240px 0 180px;
              position: relative;
              overflow: hidden;
              background-color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .section-404 .container { position: relative; z-index: 2; }
            .section-404 .title {
              margin-bottom: 24px;
              font-size: clamp(48px, 6vw, 80px);
              line-height: 1.1;
              letter-spacing: -0.03em;
            }
            .section-404 .desc {
              margin-bottom: 40px;
              max-width: 600px;
              margin-left: auto;
              margin-right: auto;
              line-height: 1.6;
              color: #52525b !important;
            }
            .glow-blur-orb {
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              width: 500px; height: 500px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(10,249,207,0.07) 0%, rgba(10,249,207,0) 70%);
              pointer-events: none;
              z-index: 1;
              filter: blur(40px);
            }
          `}</style>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
