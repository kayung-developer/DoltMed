import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. Import the main CSS file which includes Tailwind CSS directives.
// This ensures that all styles are loaded globally for the application.
import './index.css';

// 2. Import the main App component, which contains all the providers and routing logic.
import App from './App';

// 3. Import the web-vitals reporter (optional but good practice for performance monitoring).
import reportWebVitals from './reportWebVitals';

// 4. Import the i18n configuration to initialize the translation library.
// Even though it's not directly used here, importing it ensures it runs and configures i18next.
import './i18n';

// 5. Use ReactDOM.createRoot, the modern API for concurrent rendering in React 18.
// This targets the '<div id="root"></div>' in your `public/index.html`.
const root = ReactDOM.createRoot(document.getElementById('root'));

// 6. Render the application.
// Wrapping the <App /> component in <React.StrictMode> is a best practice.
// It helps identify potential problems in an application by activating additional checks
// and warnings for its descendants. It only runs in development mode.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 7. The web vitals function for performance measurement.
// This is non-essential for the app to run but is included by default with Create React App.
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();