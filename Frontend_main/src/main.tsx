import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'react-tooltip/dist/react-tooltip.css';
import './index.css';
import './patches/antdIconPatch';
import App from './App.tsx';
//import 'antd/dist/reset.css';
import 'antd/dist/antd.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
    rootEl
  );
}

