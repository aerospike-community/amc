import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import { Form, FormGroup, Input, Button, Label, Jumbotron } from 'reactstrap';

import { isAQLSet, registerAQL, executeQuery } from 'api/clusterConnections';
import { toHTML, distanceToBottom, nextNumber, timeout } from 'classes/util';
import Spinner from 'components/Spinner';
import AlertModal from 'components/AlertModal';

class ClusterAQL extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isAQLSet: false,

      isFetching: false,

      isRegisterSucccessfull: false,

      query: '',
      result: '',

      termHeight: 400,
    };

    this.id = nextNumber();
    this.onExecuteQuery = this.onExecuteQuery.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onRegisterAQL = this.onRegisterAQL.bind(this);
  }

  fetchAQLSetting(clusterID) {
    this.setState({
      isAQLSet: false
    });

    isAQLSet(clusterID)
      .then((isAQLSet) => {
        this.setState({
          isAQLSet: isAQLSet
        });
      });
  }

  componentDidMount() {
    const { clusterID } = this.props;
    this.fetchAQLSetting(clusterID);
  }

  componentDidUpdate() {
    const { termHeight } = this.state;
    const elm = document.getElementById(this.id);
    if (elm === null)
      return;

    const h = distanceToBottom(elm)-100;

    if (termHeight === h)
      return;

    this.setState({
      termHeight: h,
    });
  }

  componentWillReceiveProps(nextProps) {
    const { clusterID } = nextProps;
    if (this.props.clusterID !== clusterID)
      this.fetchAQLSetting(clusterID);
  }

  onRegisterAQL() {
    const { clusterID } = this.props;
    this.setState({isFetching: true});

    registerAQL(clusterID)
      .then(() => {
        this.setState({
          isFetching: false,
          isAQLSet: true,
          isRegisterSucccessfull: true,
        });

        timeout(() => {
          this.setState({
            isRegisterSucccessfull: false
          });
        }, 2000);
      });
  }

  onExecuteQuery() {
    const { query } = this.state;
    const { clusterID } = this.props;

    this.setState({isFetching: true});

    executeQuery(clusterID, query)
      .then((result) => {
        const html = toHTML(result);
        this.setState({
          result: html,
          isFetching: false,
        })
      })
      .catch((msg) => {
        this.setState({
          result: '',
          isFetching: false
        });
      });
  }

  onInputChange(evt) {
    const { name, value } = evt.target;

    this.setState({
      [name]: value
    });
  }

  renderQuery() {
    const { query, result, termHeight, isFetching, isAQLSet } = this.state;
    const html = {__html: result};
    const style = { height: termHeight };
    const pstyle = { margin: '15px' };

    return (
      <div>
        <div className="row">
          <Form className="col-xl-12">
            <FormGroup>
              <Label> Query </Label>
              <Input type="textarea" rows="6" name="query" value={query} 
                onChange={this.onInputChange} 
                disabled={isFetching}/>
            </FormGroup>

            <Button color="primary" onClick={this.onExecuteQuery}
                disabled={isFetching}> 
              Execute 
            </Button>
            {isFetching &&
            <Spinner />}
          </Form>
        </div>

        {result.length > 0 &&
        <div className="row" style={pstyle}>
          <div className="col-xl-12 as-terminal" style={style} id={this.id}
            dangerouslySetInnerHTML={html}> 
          </div>
        </div>
        }
      </div>
    );
  }

  render() {
    const { isAQLSet, isFetching, isRegisterSucccessfull } = this.state;

    if (isRegisterSucccessfull) {
      const message = `Successfully registered Query UDF`;
      return (
        <AlertModal header="Success" message={message} type="success" />
      );
    }

    if (isAQLSet)
      return this.renderQuery();

    return (
      <div>
        <div className="row">
          <div className="col-xl-12">
            <Jumbotron>
              <h4>
                To execute Queries a udf named aqlAPI.lua needs to be registered at
                the cluster by AMC. Please register to execute queries from AMC
              </h4>
            </Jumbotron>

            <Button color="primary" disabled={isFetching} 
              onClick={this.onRegisterAQL}>
              Register Query UDF 
            </Button>
            {isFetching &&
            <Spinner />}
          </div>
        </div>
      </div>
    );
  }
}

ClusterAQL.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default ClusterAQL;



