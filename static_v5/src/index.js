import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import app from './reducers';
import { fetchClusters } from './actions/clusters';
import VisibleApp from './containers/VisibleApp';

const store = createStore(
  app,
  applyMiddleware(
    thunkMiddleware
  )
);

render(
  <Provider store={store}>
    <VisibleApp />
  </Provider>
  , document.getElementById('app'));
