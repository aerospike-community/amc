import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';

class AddNode extends React.Component {
  constructor(props) {
    super(props);
    var inputMap = new Map();
    inputMap.set("nodeIP","")
    inputMap.set("servicePort","")
    inputMap.set("sshPort","")
    inputMap.set("sshUser","")
    inputMap.set("sshPwd","")
    this.state = {
      inputMap : inputMap
    }
    this.onChange = this.onChange.bind(this)
  }

  onChange(evt){
    let m = this.state.inputMap
    m[evt.target.name] = evt.target.value
    this.setState({
      inputMap: m
    });
  }

  render() {
    const inProgress = this.props.inProgress;
    const showWarnings = this.props.showWarnings;
    const nameWarning = showWarnings && !this.props.clusterName;
    
    return (
      <div>
        <form>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <label> Cluster Name </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  disabled={inProgress} name="clusterName" value={this.props.clusterName} placeholder="cluster_name" />
          </div>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <p>
            <label> IP </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  name="nodeIP" onChange={this.onChange} />
            </p>
          </div>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <p>
            <label> Service Port </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  name="servicePort" onChange={this.onChange} />
            </p>
          </div>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <p>
            <label> SSH Port </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  name="sshPort" onChange={this.onChange} />
            </p>
          </div>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <p>
            <label> SSH User </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  name="sshUser" onChange={this.onChange} />
            </p>
          </div>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <p>
            <label> SSH Password </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  name="sshPwd" onChange={this.onChange} />
            </p>
          </div>
        </form>

        <div className="as-submit-footer">
          {inProgress &&
           <span> <Spinner /> Saving ... </span>}

          <span> {this.props.onSaveErrorMessage} </span>
          <Button disabled={inProgress} color="primary" onClick={this.props.onBack}>Back</Button>
          <Button disabled={inProgress} color="primary" onClick={() => this.props.onAddNode(this.state.inputMap)}>Add Node</Button>
        </div>
        
      </div>  
      );
  }
}

AddNode.PropTypes = {
  clusterName: PropTypes.string,
  inProgress: PropTypes.bool,
  showWarnings: PropTypes.bool,
  onAddNode: PropTypes.func,
  onBack: PropTypes.func,
};

export default AddNode;





