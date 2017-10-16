import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { streamLogs } from 'api/node';

const MAX_LINES = 1024; // maximum number of log lines shown in the viewer

// NodeLogs displays the logs of the nodes
class NodeLogs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      logs: []
    };

    this.websocket = null; // the websocket for the logs
  }

  closeWebsocket() {
    const ws = this.websocket;
    if (ws) 
      ws.close();
  }

  componentWillUnmount() {
    this.closeWebsocket();
  }

  setWebsocket(clusterID, nodeHost) {
    this.closeWebsocket();
    this.websocket = streamLogs(clusterID, nodeHost);
    this.streamLogs();
  }

  componentDidMount() {
    const { clusterID, nodeHost } = this.props;
    this.setWebsocket(clusterID, nodeHost);
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID, nodeHost } = nextProps;
    if (this.props.clusterID !== clusterID || this.props.nodeHost !== nodeHost)
      this.setWebsocket(clusterID, nodeHost);
  }

  streamLogs() {
    this.websocket.onmessage = (evt) => {
      const lines = evt.data.split('\n');

      let logs = this.state.logs.slice(); // copy
      logs = logs.concat(lines);
      if (logs.length > MAX_LINES) {
        const n = logs.length - MAX_LINES;
        logs.splice(0, n);
      }

      this.setState({
        logs: logs
      });
    };
  }

  render() {
    const { logs } = this.state;

    return (
      <div>
        <ul className="list-unstyled">
          {logs.map((log, i) => <li key={i}> {log} </li>)}
        </ul>
      </div>
    );
  }
}

NodeLogs.PropTypes = {
  clusterID: PropTypes.string,
  nodeHost: PropTypes.string,
};

export default NodeLogs;

