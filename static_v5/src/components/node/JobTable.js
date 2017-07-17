import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { AgGridReact } from 'ag-grid-react';
import { Input } from 'reactstrap';

import { nextNumber, distanceToBottom } from 'classes/util';
import { getJobs, InProgress, Complete } from 'api/node';

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
      suppressFilter: true,
    }, {
      headerName: 'Module',
      field: 'module',
      suppressFilter: true,
    }, {
      headerName: 'Status',
      field: 'status',
      filterFramework: StatusFilter,
    }, {
      headerName: 'Progress',
      field: 'job-progress',
      suppressFilter: true,
    }, {
      headerName: 'Run Time',
      field: 'run-time',
      suppressFilter: true,
    }, {
      headerName: 'Records Read',
      field: 'recs-read',
      suppressFilter: true,
    }, {
      headerName: 'Priority',
      field: 'priority',
      suppressFilter: true,
    }, {
      headerName: 'Set',
      field: 'set',
      suppressFilter: true,
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
            datasource={this.dataSource} enableServerSideSorting enableServerSideFilter enableFilter
            pagination paginationAutoPageSize rowModelType="infinite" cacheOverflowSize="2"
        />
      </div>
    );
  }
}

const NoStatus = '';
class StatusFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      status: NoStatus,
    };

    this.onInputChange = this.onInputChange.bind(this);
  }

  componentDidUpdate() {
    this.props.filterChangedCallback();
  }

  onInputChange(evt) {
    let { value } = evt.target;

    this.setState({
      status: value,
    });
  }

  getModel() {
    const { status } = this.state;
    return { value: status};
  }

  isFilterActive() {
    return true;
  }

  render() {
    const { status } = this.state;

    return (
        <Input type="select" value={status} onChange={this.onInputChange}>
          <option value={NoStatus}> All </option>
          <option value={InProgress}> In Progress  </option>
          <option value={Complete}> Completed </option>
        </Input>
    );
  }
}

class JobDataSource {
  constructor(clusterID, nodeHost) {
    this.clusterID = clusterID;
    this.nodeHost = nodeHost;

    this.status = InProgress;
  }

  getRows(params) {
    const { startRow, endRow, sortModel, sortFilter, filterModel } = params;

    let sortOrder = '', sortBy = '';
    if (sortModel.length > 0) {
      const sm = sortModel[0];
      sortOrder = sm.colId;
      sortBy = sm.sort;
    }

    const status = filterModel.status ? filterModel.status.value : '';
    getJobs(this.clusterID, this.nodeHost, status, startRow, endRow, sortOrder, sortBy)
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


