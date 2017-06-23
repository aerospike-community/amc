import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Table } from 'reactstrap';
import classNames from 'classnames';

import UpgradeCluster from 'components/cluster/UpgradeCluster';
import AddNode from 'components/cluster/AddNode';
import Spinner from 'components/Spinner';
import { getNodesSummary } from 'api/node';
import { getHostname } from 'api/deploy';
import bytes from 'bytes';

// ChangeClusterConnection is a "view only" component to change
// a cluster connection.
//
class ChangeClusterConnection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clusterName: this.props.clusterName,
      nodeHosts: this.props.nodeHosts,
      view : "home",
      showWarnings: false,
    };
    this.onCancel = this.onCancel.bind(this);
    this.removeNode = this.removeNode.bind(this);
    this.restartNode = this.restartNode.bind(this);
    this.changeView = this.changeView.bind(this)
    this.upgradeCluster = this.upgradeCluster.bind(this)
    this.addNode = this.addNode.bind(this)
    this.downloadDeployment = this.downloadDeployment.bind(this)
  }

  fetchSummary(clusterID, nodeHosts) {
    if (!clusterID || !nodeHosts || nodeHosts.length === 0)
      return;

    getNodesSummary(clusterID, nodeHosts)
      .then((summary) => {
        this.setState({
          nodesSummary: summary
        });
      })
      .catch((message) => {
        // TODO
        console.error(message);
      });
  }

  componentWillMount() {
    const { clusterID, nodeHosts } = this.props;
    this.fetchSummary(clusterID, nodeHosts);
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    const { clusterID, nodeHosts } = nextProps;

    if (props.clusterID !== clusterID 
          // naive check for nodeHosts equality
          // refetching does not matter, and it happens very rarely
          || props.nodeHosts.join('') !== nodeHosts.join('')) {
      this.fetchSummary(clusterID, nodeHosts);
    }
  }

  onCancel() {
    this.props.onCancel();
  }

  removeNode(node){
    
  }

  restartNode(node){

  }

  upgradeCluster(newVersion){
    this.changeView("home")
  }

  addNode(newNodeInfo){
    const node = newNodeInfo["nodeIP"]
    this.changeView("inprogress")
    getHostname(node)
      .then((hostname) => {
        alert(hostname[node]["hostname"])
        this.changeView("home")
      })
      .catch((message) => {
        // TODO
        alert("error" + message)
        this.changeView("home")
      });
    
  }

  downloadDeployment(){
    // fake server request, getting the file url as response
    setTimeout(() => {
      const response = {
        file: 'resources/deployment.json',
      };
      // server sent the url to the file!
      // now, let's download:
      window.location.href = response.file;
      // you could also do:
      //window.open(response.file);
    }, 100);
  }

  changeView(newView){
    this.setState({
      view: newView
    });
  }
  nodes() {
    
    const nodes = this.state.nodesSummary;
    const memory = (s) => {
      return bytes(s['used-bytes']) + ' / ' +  bytes(s['total-bytes']);
    }

    const data = [];
    for (const nodeHost in nodes) {
      const node = nodes[nodeHost];
      const { stats } = node;
      const row = (
        <tr key={nodeHost}>
          <td><input className="form-control" type="text" name="nodeHost" value={nodeHost} placeholder="nodeHost" /></td>
          <td><input className="form-control" type="text" name="build" value={stats.build} placeholder="build" /></td>
          <td><input className="form-control" type="text" name="cluster_size" value={stats.cluster_size} placeholder="cluster_size" /></td>
          <td><input className="form-control" type="text" name="disk" value={memory(node.disk)} placeholder="disk" /></td>
          <td><input className="form-control" type="text" name="memory" value={memory(node.memory)} placeholder="memory" /></td>
          <td><div className="col-xl-3">
              <Button size="sm" style={{ marginTop: 5 }} onClick={() => this.removeNode(nodeHost)}> Remove </Button>
              </div>
          </td>
          <td>
              <div>
              <Button size="sm" style={{ marginTop: 5 }} onClick={() => this.restartNode(nodeHost)}> Restart </Button>
            </div>
          </td>
        </tr>
      );
      data.push(row);
    }

    return data;
  }

  render() {
    const inProgress = this.props.inProgress;
    const showWarnings = this.state.showWarnings;
    const nameWarning = showWarnings && !this.state.clusterName;
    const nodes = this.nodes();
    const view = this.state.view;
    let dashboard;
    if (view == "upgrade"){
      const nodesSummary = this.state.nodesSummary;
      const nodeKey = Object.keys(nodesSummary)[0];
      const { stats } = nodesSummary[nodeKey];
      const currentVersion = stats.build
      dashboard = <UpgradeCluster clusterName={this.state.clusterName} currentVersion={currentVersion} 
                    inProgress={inProgress} showWarnings={showWarnings} onUpgrade={this.upgradeCluster}
                    onBack={() => this.changeView("home")}
                  />;
        
    } else if (view === "addNode") {
      dashboard = <AddNode clusterName={this.state.clusterName} 
                    inProgress={inProgress} showWarnings={showWarnings} onAddNode={this.addNode}
                    onBack={() => this.changeView("home")}
                  />;
    } else if (view == "inprogress") {
      dashboard = <h5> <Spinner /> Connecting ... </h5>;
    }
    else{
      dashboard =   <div>
        <form>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <label> Cluster Name </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  disabled={inProgress} name="clusterName" value={this.state.clusterName} placeholder="cluster_name" />
          </div>
          <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Nodes
          </div>
        </div>
        <div className="row">
          <div className="col-xl-12"> 
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th> Host</th>
                  <th> Build </th>
                  <th> Cluster Size </th>
                  <th> Disk </th>
                  <th> RAM </th>
                </tr>
              </thead>
              <tbody>
                {nodes}
              </tbody>
            </Table>
          </div>
        </div>
        </div>

        </form>

        <div className="as-submit-footer">
          {inProgress &&
           <span> <Spinner /> Saving ... </span>}

          <span> {this.props.onSaveErrorMessage} </span>
          <Button disabled={inProgress} color="primary" onClick={this.onCancel}>Cancel</Button>
          <Button disabled={inProgress} color="primary" onClick={() => this.changeView("upgrade")}>Upgrade</Button>
          <Button disabled={inProgress} color="primary" onClick={() => this.changeView("addNode")}>Add Node</Button>
          <Button disabled={inProgress} color="primary" href="resources/deployment.json" download="deployment.json" style={{marginLeft:"10px"}}>Download Deployment File</Button>
        </div>
        
      </div>  
    }
    return (
      dashboard
      );
  }
}

ChangeClusterConnection.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // name of cluster
  clusterName: PropTypes.string,
  // adding a connection is in progress
  inProgress: PropTypes.bool,
  // error message on save
  onSaveErrorMessage: PropTypes.bool,
  // callback to cancel 
  // onCancel()
  onCancel: PropTypes.func,
  // the member nodes of the cluster
  nodeHosts: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ChangeClusterConnection;

