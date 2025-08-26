import { css } from 'lit';

export default css`
 :host {
      display: block;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .container {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    
    .message {
      color: #666;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    button {
      position: relative;
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    button::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 2px;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.3s ease;
    }
    
    button:hover::after {
      transform: scaleX(1);
      transform-origin: left;
    }
    
    .delete-btn {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .delete-btn:hover {
      background-color: #ffcdd2;
    }
    
    .download-btn {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .download-btn:hover {
      background-color: #c8e6c9;
    }
    
    /* Animaciones */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .deleting {
      animation: shake 0.5s ease infinite;
    }
    
    .downloading {
      animation: pulse 1s ease infinite;
    }
    
    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: currentColor;
      animation: spin 1s ease infinite;
    }
    
    .icon {
      transition: transform 0.3s ease;
    }
    
    button:hover .icon {
      transform: scale(1.2);
    }
`;
