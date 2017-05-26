import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import app from './reducers';
import { fetchClusters } from './actions/clusters';
import VisibleApp from './containers/VisibleApp';

// import all css
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import 'nvd3/build/nv.d3.css';

import './styles/common.css';
import './styles/chart.css';

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
