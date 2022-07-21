import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import reportWebVitals from './reportWebVitals';
import TeamsContexProvider from './provider/TeamsContextProvider'

import './index.css';

ReactDOM.render(
    <TeamsContexProvider>
        <App/>
    </TeamsContexProvider>,
  document.getElementById('root')
);

reportWebVitals();