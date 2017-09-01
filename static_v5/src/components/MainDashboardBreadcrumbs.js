import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { isLogicalView } from 'classes/util';
import { VIEW_TYPE as VT, LOGICAL_VIEW_TYPE as LVT } from 'classes/constants';

const physicalBreadcrumbs = {
  'Nodes Overview':     [VT.NODE_OVERVIEW],
  ':nodeHost':          [VT.NAMESPACE, VT.NAMESPACE_OVERVIEW, VT.NODE, 
                          VT.SET, VT.SET_OVERVIEW],
  'Namespace Overview': [VT.NAMESPACE_OVERVIEW],
  ':namespaceName':     [VT.NAMESPACE, VT.SET, VT.SET_OVERVIEW],
  'Sets Overview':      [VT.SET_OVERVIEW],
  ':setName':           [VT.SET],
  'Indexes Overview':   [VT.INDEXES_OVERVIEW],
  ':indexName':         [VT.INDEX],
  'UDF Overview':       [VT.UDF_OVERVIEW],
  ':udfName':           [VT.UDF],
};

const logicalBreadcrumbs = {
  ':namespaceName': [LVT.LOGICAL_NAMESPACE],
};

// MainDashboardBreadcrumbs shows the header for the view the user is in.
class MainDashboardBreadcrumbs extends React.Component {
  constructor(props) {
    super(props);
  }

  breadcrumbItems() {
    const { clusterName } = this.props;
    const cv = this.props.currentView;
    const vt = cv.viewType;

    const view = isLogicalView(vt) ? 'Logical View' : 'Physical View';
    const items = [view, clusterName];

    const bc = isLogicalView(vt) ? logicalBreadcrumbs : physicalBreadcrumbs;
    Object.keys(bc).forEach((k) => {
      const vts = bc[k];
      const add = vts.find((v) => v === vt);
      if (!add)
        return;

      if (k.startsWith(':')) {
        k = k.slice(1);
        items.push(cv[k]);
      } else {
        items.push(k);
      }
    });

    return items;
  }

  render() {
    const arr = [];

    const items = this.breadcrumbItems();
    items.forEach((item, i) => {
      arr.push(item);
      if (i < items.length-1)
        arr.push(<span key={i} className="as-separator"> / </span>);
    });

		return (
			<div className="row">
        <div className="col-xl-12 as-breadcrumbs">
          {arr}
        </div>
			</div>
		);
  }
}

MainDashboardBreadcrumbs.PropTypes = {
  // current view state
  currentView: PropTypes.object,
  // name of the cluster the view is in
  clusterName: PropTypes.bool,
};

export default MainDashboardBreadcrumbs;

