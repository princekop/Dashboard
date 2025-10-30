"use client"

import React from 'react'

export default function SocialCard() {
  return (
    <div className="social-card-wrapper">
      <div className="social-card">
        <div className="social-background"></div>
        <div className="social-logo">
          <div className="logo-text">PxB</div>
        </div>
        
        <a href="https://instagram.com/princexbyte" target="_blank" rel="noopener noreferrer" className="social-box social-box1">
          <span className="social-icon">
            <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" className="social-svg">
              <path d="M 9.9980469 3 C 6.1390469 3 3 6.1419531 3 10.001953 L 3 20.001953 C 3 23.860953 6.1419531 27 10.001953 27 L 20.001953 27 C 23.860953 27 27 23.858047 27 19.998047 L 27 9.9980469 C 27 6.1390469 23.858047 3 19.998047 3 L 9.9980469 3 z M 22 7 C 22.552 7 23 7.448 23 8 C 23 8.552 22.552 9 22 9 C 21.448 9 21 8.552 21 8 C 21 7.448 21.448 7 22 7 z M 15 9 C 18.309 9 21 11.691 21 15 C 21 18.309 18.309 21 15 21 C 11.691 21 9 18.309 9 15 C 9 11.691 11.691 9 15 9 z M 15 11 A 4 4 0 0 0 11 15 A 4 4 0 0 0 15 19 A 4 4 0 0 0 19 15 A 4 4 0 0 0 15 11 z" />
            </svg>
          </span>
        </a>
        
        <a href="https://wa.me/918826128886" target="_blank" rel="noopener noreferrer" className="social-box social-box2">
          <span className="social-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="social-svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </span>
        </a>
        
        <a href="https://discord.gg/CSxeSCZC2A" target="_blank" rel="noopener noreferrer" className="social-box social-box3">
          <span className="social-icon">
            <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg" className="social-svg">
              <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
            </svg>
          </span>
        </a>
        
        <div className="social-box social-box4"></div>
      </div>

      <style jsx>{`
        .social-card-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .social-card {
          position: relative;
          width: 200px;
          height: 200px;
          background: lightgrey;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
          transition: all 1s ease-in-out;
        }

        .social-background {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 100% 107%, #ff89cc 0%, #9cb8ec 30%, #00ffee 60%, #62c2fe 100%);
        }

        .social-logo {
          position: absolute;
          right: 50%;
          bottom: 50%;
          transform: translate(50%, 50%);
          transition: all 0.6s ease-in-out;
          z-index: 10;
        }

        .logo-text {
          font-size: 32px;
          font-weight: 900;
          color: #000000;
          font-family: 'Arial Black', sans-serif;
          letter-spacing: -2px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .social-icon {
          display: inline-block;
          width: 20px;
          height: 20px;
        }

        .social-svg {
          fill: rgba(255, 255, 255, 0.797);
          width: 100%;
          transition: all 0.5s ease-in-out;
        }

        .social-box {
          position: absolute;
          padding: 10px;
          text-align: right;
          background: rgba(255, 255, 255, 0.389);
          border-top: 2px solid rgb(255, 255, 255);
          border-right: 1px solid white;
          border-radius: 10% 13% 42% 0%/10% 12% 75% 0%;
          box-shadow: rgba(100, 100, 111, 0.364) -7px 7px 29px 0px;
          transform-origin: bottom left;
          transition: all 1s ease-in-out;
          cursor: pointer;
          text-decoration: none;
        }

        .social-box::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          transition: all 0.5s ease-in-out;
        }

        .social-box:hover .social-svg {
          fill: white;
        }

        .social-box1 {
          width: 70%;
          height: 70%;
          bottom: -70%;
          left: -70%;
        }

        .social-box1::before {
          background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #ff53d4 60%, #62c2fe 90%);
        }

        .social-box1:hover::before {
          opacity: 1;
        }

        .social-box1:hover .social-icon .social-svg {
          filter: drop-shadow(0 0 5px white);
        }

        .social-box2 {
          width: 50%;
          height: 50%;
          bottom: -50%;
          left: -50%;
          transition-delay: 0.2s;
        }

        .social-box2::before {
          background: radial-gradient(circle at 30% 107%, #25D366 0%, #128C7E 90%);
        }

        .social-box2:hover::before {
          opacity: 1;
        }

        .social-box2:hover .social-icon .social-svg {
          filter: drop-shadow(0 0 5px white);
        }

        .social-box3 {
          width: 30%;
          height: 30%;
          bottom: -30%;
          left: -30%;
          transition-delay: 0.4s;
        }

        .social-box3::before {
          background: radial-gradient(circle at 30% 107%, #969fff 0%, #5865F2 90%);
        }

        .social-box3:hover::before {
          opacity: 1;
        }

        .social-box3:hover .social-icon .social-svg {
          filter: drop-shadow(0 0 5px white);
        }

        .social-box4 {
          width: 10%;
          height: 10%;
          bottom: -10%;
          left: -10%;
          transition-delay: 0.6s;
          cursor: default;
        }

        .social-card:hover {
          transform: scale(1.1);
        }

        .social-card:hover .social-box {
          bottom: -1px;
          left: -1px;
        }

        .social-card:hover .social-logo {
          transform: translate(0, 0);
          bottom: 20px;
          right: 20px;
        }
      `}</style>
    </div>
  )
}
