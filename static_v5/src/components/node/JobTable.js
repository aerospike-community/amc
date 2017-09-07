import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { AgGridReact } from 'ag-grid-react';
import { Input } from 'reactstrap';

import { nextNumber, distanceToBottom } from 'classes/util';
import { getJobs, InProgress, Complete } from 'api/node';
import AgGridPagination from 'components/AgGridPagination';

// JobTable diplays a table of jobs
// for a node
class JobTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      height: 200,
      gridAPI: null,
    };

    const { clusterID, nodeHost } = this.props;
    this.dataSource = new JobDataSource(clusterID, nodeHost);

    this.id = 'node_job_table' + nextNumber();

    this.onGridReady = this.onGridReady.bind(this);
  }

  onGridReady(params) {
    this.setState({
      gridAPI: params.api
    });
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, nodeHost }  = this.props;

    const np = nextProps;
    if (np.clusterID !== clusterID || np.nodeHost !== nodeHost) {
      const { gridAPI } = this.state;
      this.dataSource = new JobDataSource(np.clusterID, np.nodeHost);
      gridAPI.setDatasource(this.dataSource);
    }
  }

  componentDidMount() {
    const elm = document.getElementById(this.id);
    let h = distanceToBottom(elm) - 60;

    this.setState({
      height: h,
    });
  }

  columnDefs() {
    return [{
      cellClass: 'as-grid-cell',
      headerName: 'Namespace',
      field: 'ns',
      suppressFilter: true,
    }, {
      cellClass: 'as-grid-cell',
      headerName: 'Module',
      field: 'module',
      suppressFilter: true,
    }, {
      cellClass: 'as-grid-cell',
      headerName: 'Status',
      field: 'status',
      filterFramework: StatusFilter,
    }, {
      cellClass: 'as-grid-cell',
      headerName: 'Progress',
      field: 'job-progress',
      suppressFilter: true,
    }, {
      cellClass: 'as-grid-cell',
      headerName: 'Run Time',
      field: 'run-time',
      suppressFilter: true,
    }, {
      cellClass: 'as-grid-cell',
      headerName: 'Records Read',
      field: 'recs-read',
      suppressFilter: true,
    }, {
      cellClass: 'as-grid-cell',
      headerName: 'Priority',
      field: 'priority',
      suppressFilter: true,
    }, {
      cellClass: 'as-grid-cell',
      headerName: 'Set',
      field: 'set',
      suppressFilter: true,
      width: 470,
    }, {
      headerName: 'Others',
      cellRendererFramework: AllPropsRenderer,
      suppressFilter: true,
      suppressSorting: true,
      width: 1500, // all properties fit in this width
    }];
  }

  render() {
    const { height, gridAPI } = this.state;
    const columnDefs = this.columnDefs();

    return (
      <div className="ag-material" id={this.id} style={{height: height}}>
        <AgGridReact 
            onGridReady={this.onGridReady}
            columnDefs={columnDefs} 
            rowHeight="40" suppressScrollOnNewData enableColResize 
            datasource={this.dataSource} enableServerSideSorting enableServerSideFilter enableFilter
            suppressPaginationPanel pagination paginationAutoPageSize rowModelType="infinite" cacheOverflowSize="2"
        />

        <AgGridPagination gridAPI={gridAPI} />
      </div>
    );
  }
}

class AllPropsRenderer extends React.Component {
  renderData() {
    const { data } = this.props;
    const keys = Object.keys(data);

    const row = [];
    keys.forEach((k) => {
      const value = data[k];
      const type = typeof(value);

      if (type === 'function' || type === 'object')
        return;

      // headers shown in other columns
      const headers = ['ns', 'module', 'status', 'job-progress', 'run-time', 
                       'recs-read', 'priority', 'set'];
      
      if(headers.findIndex((h) => h === k) !== -1)
        return;

      row.push(
        <div className="float-left as-grid-cell" style={{marginRight: 10}} key={k}>
          <span style={{fontWeight: 'bold', marginRight: 5}}>
            {k}: 
          </span>
          {value}
        </div>
      );
    });

    return row;
  }

  render() {
    return (
      <div className="as-grid-cell">
        {this.renderData()}
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


