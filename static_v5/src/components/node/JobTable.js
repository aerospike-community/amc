import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { AgGridReact } from 'ag-grid-react';
import { Input } from 'reactstrap';

import { nextNumber, distanceToBottom } from 'classes/util';
import { getJobs, InProgress, Complete, setJobPriority, killJob } from 'api/node';
import AgGridPagination from 'components/AgGridPagination';
import AlertModal from 'components/AlertModal';
import { timeout } from 'classes/util';
import { Button } from 'reactstrap';

// JobTable diplays a table of jobs
// for a node
class JobTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      height: 200,
      gridAPI: null,

      killJobSuccess: false,
      killJobFailed: false,
      killJobMessage: '',

      setPrioritySuccess: false,
      setPriorityFailed: false,
      setPriorityMessage: '',
    };

    const { clusterID, nodeHost } = this.props;
    this.dataSource = new JobDataSource(clusterID, nodeHost);

    this.id = 'node_job_table' + nextNumber();

    this.onGridReady = this.onGridReady.bind(this);
    this.onPriorityEdit = this.onPriorityEdit.bind(this);
    this.onKillJob = this.onKillJob.bind(this);
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

  onKillJob(job) {
    const setState = (success= false, failed = false, msg = '') => {
      this.setState({
        killJobSuccess: success,
        killJobFailed: failed,
        killJobMessage: msg
      });
    };

    const rerender = () => {
      const { gridAPI } = this.state;
      timeout(() => setState(), 2000);
      gridAPI.refreshInfiniteCache();
    };

    const { clusterID, nodeHost }  = this.props;
    const { module, trid } = job;
    killJob(clusterID, nodeHost, module, trid)
      .then(() => {
        const msg = `Successfully killed job ${trid}`;
        setState(true, false, msg);
        rerender();
      })
      .catch((err) => {
        const msg = `Failed to kill job ${trid}`;
        setState(false, true, msg + ' ' + err);
        rerender();
      });
  }

  onPriorityEdit(job, priority) {
    const setState = (success= false, failed = false, msg = '') => {
      this.setState({
        setPrioritySuccess: success,
        setPriorityFailed: failed,
        setPriorityMessage: msg
      });
    };

    const { clusterID, nodeHost } = this.props;
    const { module, trid } = job;

    const rerender = () => {
      const { gridAPI } = this.state;
      timeout(() => setState(), 2000);
      gridAPI.refreshInfiniteCache();
    };

    setJobPriority(clusterID, nodeHost, module, trid, priority)
      .then(() => {
        const msg = `Successfully changed priority of job ${trid} to ${priority}`;
        setState(true, false, msg);
        rerender();
      })
      .catch((err) => {
        const msg = `Failed to change priority of job ${trid} to ${priority}`;
        setState(false, true, msg + ' ' + err);
        rerender();
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
      cellRendererFramework: ProgressRenderer,
      headerName: 'Progress',
      suppressFilter: true,
      suppressSorting: true,
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

      editable: (n) => {
        const d = n.node.data;
        return d['job-progress'] < 100 && d.status.indexOf('done') === -1;
      },
      cellEditorFramework: PriorityEditor,
      onCellValueChanged: (node) => {
        const { data, newValue } = node;
        this.onPriorityEdit(data, newValue);
      }
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
    const context = { componentParent: this };

    const { setPrioritySuccess, setPriorityFailed } = this.state;
    const { killJobSuccess, killJobFailed } = this.state;
    const pmsg = this.state.setPriorityMessage;
    const kmsg = this.state.killJobMessage;

    return (
    <div>
      {setPrioritySuccess &&
        <AlertModal header="Success" message={pmsg} type="success" />
      }

      {setPriorityFailed && 
        <AlertModal header="Failed" message={pmsg} type="error" />
      }

      {killJobSuccess &&
        <AlertModal header="Success" message={kmsg} type="success" />
      }

      {killJobFailed && 
        <AlertModal header="Failed" message={kmsg} type="error" />
      }

      <div className="ag-material" id={this.id} style={{height: height}}>
        <AgGridReact 
            onGridReady={this.onGridReady}
            columnDefs={columnDefs} 
            context={context}
            rowHeight="40" suppressScrollOnNewData enableColResize 
            datasource={this.dataSource} enableServerSideSorting enableServerSideFilter enableFilter
            suppressPaginationPanel pagination paginationAutoPageSize rowModelType="infinite" cacheOverflowSize="2"
        />

        <AgGridPagination gridAPI={gridAPI} />
      </div>
    </div>
    );
  }
}

class ProgressRenderer extends React.Component {
  constructor(props) {
    super(props);

    this.onKillJob = this.onKillJob.bind(this);
  }

  onKillJob() {
    const job = this.props.data;
    this.props.context.componentParent.onKillJob(job);
  }

  render() {
    if (!this.props.data)
      return null;
    
    const job = this.props.data;
    const progress = job['job-progress'];
    const { status } = job;
    const canKill = progress < 100 && status.indexOf('done') === -1;

    return (
      <div className="as-grid-cell">
        {progress}
        {canKill &&
        <Button size="sm" color="danger" className="as-margin-btn" 
          onClick={this.onKillJob}>
          Kill 
        </Button>
        }
      </div>
    );
  }
}

class PriorityEditor extends React.Component {
  constructor(props) {
    super(props);

    const v = props.value;
    let priority = 'medium';
    if (v === 1)
      priority = 'low';
    else if (v === 5)
      priority = 'high';

    this.state = {
      priority: priority
    };

    this.onInputChange = this.onInputChange.bind(this);
  }

  onInputChange(evt) {
    const { value } = evt.target;
    this.setState({
      priority: value
    });
  }

  getValue() {
    return this.state.priority;
  }

  render() {
    const { priority } = this.state;
    return (
      <Input type="select" onChange={this.onInputChange} value={priority}>
        <option value="low"> 1 (Low) </option>
        <option value="medium"> 3 (Medium) </option>
        <option value="high"> 5 (High) </option>
      </Input>
    );
  }
}

class AllPropsRenderer extends React.Component {
  renderData() {
    if (!this.props.data)
      return null;

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


