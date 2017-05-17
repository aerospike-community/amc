import React from 'react';
import { render } from 'react-dom';
import { connect } from 'react-redux';

import NodeDashboard from './NodeDashboard';
import VisibleUDFDashboard from '../containers/VisibleUDFDashboard';
import { selectPath as selectPathAction} from '../actions/currentView';
import { VIEW_TYPE } from '../classes/constants';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

class MainDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.changeView = this.changeView.bind(this);
  }

  changeView(toView) {
    const { selectedEntityPath, view } = this.props.currentView;
    if (toView === view)
      return;

    this.props.selectPath(selectedEntityPath, toView);
  }

  render() {
    const { currentView } = this.props;
    const { entities, viewType, view } = currentView;
    const { clusterID, nodeHost, namespaceName, setName, udfName } = currentView;

    let dashboard;

    if (viewType === VIEW_TYPE.NODE)
      dashboard = <NodeDashboard clusterID={clusterID} nodeHost={nodeHost} />
    else if (viewType === VIEW_TYPE.UDF || viewType === VIEW_TYPE.UDF_OVERVIEW)
      dashboard = <VisibleUDFDashboard />
    else
      dashboard = viewType + ' ' + view;

    return (
      <div>
        {dashboard}
      </div>
      );
  }
}

const main = connect((state) => {
  return {
    currentView: state.currentView
  };
}, (dispatch) => {
  return {
    selectPath: (path, view) => dispatch(selectPathAction(path, view))
  }
})(MainDashboard);

export default main;
