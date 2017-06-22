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
import 'react-widgets/lib/less/react-widgets.less';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-bootstrap.css';

import './styles/index.scss';

// For deploy_cluster
import 'react-tabs/style/react-tabs.scss';

// some initialization
// see http://jquense.github.io/react-widgets/docs/#/i18n?_k=gqx37t
import moment from 'moment';
import momentLocalizer from 'react-widgets/lib/localizers/moment';
momentLocalizer(moment);

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
