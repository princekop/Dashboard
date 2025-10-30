"use client"

import React from 'react';

export function BrandingCard() {
  return (
    <div className="card">
      <div className="border" />
      <div className="content">
        <div className="logo-text">PxB</div>
        <div className="logo-subtitle">BY PB</div>
      </div>
      <span className="bottom-text">INNOVATION & EXCELLENCE</span>

      <style jsx>{`
        .card {
          width: 350px;
          height: 220px;
          background: linear-gradient(135deg, rgba(30, 58, 68, 0.95), rgba(40, 70, 82, 0.9));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          overflow: visible;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .border {
          position: absolute;
          inset: 0px;
          border: 2px solid #C9A961;
          opacity: 0;
          border-radius: 20px;
          transform: rotate(5deg) scale(0.95);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bottom-text {
          position: absolute;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 0px 8px;
          color: #C9A961;
          background: rgba(30, 58, 68, 0.8);
          backdrop-filter: blur(10px);
          opacity: 0;
          letter-spacing: 3px;
          border-radius: 4px;
          transition: all 0.6s ease-in-out;
        }

        .content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          z-index: 2;
        }

        .logo-text {
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 800;
          color: #C9A961;
          font-size: 72px;
          letter-spacing: 4px;
          text-align: center;
        }

        .logo-subtitle {
          font-size: 13px;
          font-weight: 600;
          color: #8B7355;
          letter-spacing: 3px;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .card:hover {
          border-radius: 16px;
          transform: scale(1.05);
          background: linear-gradient(135deg, rgba(35, 65, 78, 0.98), rgba(45, 78, 92, 0.95));
          box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.5);
        }

        .card:hover .border {
          inset: 12px;
          opacity: 1;
          transform: rotate(0) scale(1);
          border-radius: 8px;
        }

        .card:hover .bottom-text {
          letter-spacing: 4px;
          opacity: 1;
          transform: translateX(-50%);
        }

        .card:hover .logo-subtitle {
          color: #C9A961;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
