import React from 'react'
import { render } from 'react-dom'

import { createStore, applyMiddleware } from  'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'

import App from './components/App'
import webApp from  './reducers'

let store = createStore(
    webApp,
    applyMiddleware(
        thunkMiddleware,
        createLogger()
    )
);

import './index.css';

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
