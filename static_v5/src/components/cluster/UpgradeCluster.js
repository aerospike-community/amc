import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';

class UpgradeCluster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newVersion : "3.13.0"
    }
    this.onVersionChange = this.onVersionChange.bind(this)
  }

  onVersionChange(evt){
    this.setState({
      newVersion: evt.target.value
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
                  disabled={inProgress} name="clusterName" value={this.props.clusterName} placeholder="clusterName" />
          </div>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <p>
            <label> Current Version </label>
            <input type="text" className={classNames('form-control', {'form-control-warning': nameWarning})} 
                  disabled={inProgress} name="currentVersion" value={this.props.currentVersion} placeholder="currentVersion" />
            </p>
          </div>
          <div className={classNames('form-group', {
                            'has-warning': nameWarning
                          })}>
            <label> New Version </label>
            <p>
            <select size="1" name="newVersion" id="newVersion" onChange={this.onVersionChange} defaultValue="3.13.0">
              <option value="3.13.0">3.13.0</option>
              <option value="2.1.1">2.1.1</option>
              <option value="2.0.0">2.0.0</option>
            </select>
            </p>
          </div>
        </form>

        <div className="as-submit-footer">
          {inProgress &&
           <span> <Spinner /> Saving ... </span>}

          <span> {this.props.onSaveErrorMessage} </span>
          <Button disabled={inProgress} color="primary" onClick={this.props.onBack}>Back</Button>
          <Button disabled={inProgress} color="primary" onClick={() => this.props.onUpgrade(this.state.newVersion)}>Upgrade</Button>
        </div>
        
      </div>  
      );
  }
}

UpgradeCluster.PropTypes = {
  clusterName: PropTypes.string,
  currentVersion: PropTypes.string,
  inProgress: PropTypes.bool,
  showWarnings: PropTypes.bool,
  onUpgrade: PropTypes.func,
  onBack: PropTypes.func,
};

export default UpgradeCluster;





