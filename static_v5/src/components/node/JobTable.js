import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { AgGridReact } from 'ag-grid-react';

import { nextNumber, distanceToBottom } from 'classes/util';
import { getJobs } from 'api/node';

// JobTable diplays a table of jobs
// for a node
class JobTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      height: 200,
    };

    const { clusterID, nodeHost } = this.props;
    this.dataSource = new JobDataSource(clusterID, nodeHost);

    this.id = 'node_job_table' + nextNumber();
    this.gridAPI = null;

    this.onGridReady = this.onGridReady.bind(this);
  }

  onGridReady(params) {
    this.gridAPI = params.api;
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, nodeHost }  = this.props;

    const np = nextProps;
    if (np.clusterID !== clusterID || np.nodeHost !== nodeHost) {
      this.dataSource = new JobDataSource(np.clusterID, np.nodeHost);
      this.gridAPI.setDatasource(this.dataSource);
    }
  }

  componentDidMount() {
    const elm = document.getElementById(this.id);
    let h = distanceToBottom(elm) - 50;

    this.setState({
      height: h,
    });
  }

  columnDefs() {
    return [{
      headerName: 'Namespace',
      field: 'ns',
    }, {
      headerName: 'Module',
      field: 'module',
    }, {
      headerName: 'Status',
      field: 'status',
    }, {
      headerName: 'Progress',
      field: 'job-progress',
    }, {
      headerName: 'Run Time',
      field: 'run-time',
    }, {
      headerName: 'Records Read',
      field: 'recs-read',
    }, {
      headerName: 'Priority',
      field: 'priority',
    }, {
      headerName: 'Set',
      field: 'set',
      width: 470,
    }];
  }

  render() {
    const { height } = this.state;
    const columnDefs = this.columnDefs();

    return (
      <div className="ag-material" id={this.id} style={{height: height}}>
        <AgGridReact 
            onGridReady={this.onGridReady}
            columnDefs={columnDefs} 
            rowHeight="40" suppressScrollOnNewData enableColResize 
            datasource={this.dataSource} enableServerSideSorting 
            pagination paginationAutoPageSize rowModelType="infinite" cacheOverflowSize="2"
        />
      </div>
    );
  }
}

class JobDataSource {
  constructor(clusterID, nodeHost) {
    this.clusterID = clusterID;
    this.nodeHost = nodeHost;
  }

  getRows(params) {
    const { startRow, endRow, sortModel } = params;

    let sortOrder = '', sortBy = '';
    if (sortModel.length > 0) {
      const sm = sortModel[0];
      sortOrder = sm.colId;
      sortBy = sm.sort;
    }

    getJobs(this.clusterID, this.nodeHost, startRow, endRow, sortOrder, sortBy)
      .then((response) => {
        const { jobs, jobCount } = response;
        params.successCallback(jobs, jobCount);
      })
      .catch((message) => {
        params.failCallback();
      });
  }
}

JobTable.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  nodeHost: PropTypes.string.isRequired,
};

export default JobTable;


