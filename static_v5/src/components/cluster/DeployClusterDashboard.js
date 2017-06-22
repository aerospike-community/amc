import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';

class DeployClusterDashboard extends React.Component {
  constructor(props) {
    super(props);
    var inputMap = new Map();
    inputMap.set("clusterName","")
    inputMap.set("asVersion","")
    this.state = { 
      tabIndex : 0 , 
      view : "deployHome",
      inputMap : inputMap,
      data : null
    };
    this.changeView = this.changeView.bind(this)
    this.onChange = this.onChange.bind(this)
    this.handleFile = this.handleFile.bind(this)
    this.fetchValue = this.fetchValue.bind(this)
  }

  changeView(newView){
    this.setState({
      view: newView
    });
  }

  onChange(evt){
    let m = this.state.inputMap
    m[evt.target.name] = evt.target.value
    this.setState({
      inputMap: m
    });
  }

  fetchValue(keys){
    let keyArr = keys.split(".")
    let data = this.state.data
    for (var i = 0; i < keyArr.length; i++) {
        let key = keyArr[i]
        if (key in data) {
          data = data[key]
        }
        else{
          return ""
        }
    }
    return data
  }

  handleFile(e){
    var reader = new FileReader();
        var file = e.target.files[0];

        reader.onload = function(upload) {
            this.setState({
                data: JSON.parse(upload.target.result)
                
            });
        }.bind(this);
        reader.readAsText(file);
        
  }
  
  render() {
    const view = this.state.view;
    const clusterName = this.state.inputMap["clusterName"]
    const asVersion = this.state.inputMap["asVersion"]
    let dashboard;
    if (view == "deployHome"){
      dashboard = <div>
        <form>
          <p>
            <label> Cluster Name </label>
            <input type="text" className={classNames('form-control')} 
                  name="clusterName" defaultValue={clusterName} onChange={this.onChange} />
          </p>
          <p>
            <label> Aerospike Version </label>
            <select size="1" name="asVersion" onChange={this.onChange} defaultValue={asVersion}>
              <option value="3.13.0">3.13.0</option>
              <option value="2.1.1">2.1.1</option>
              <option value="2.0.0">2.0.0</option>
            </select>
          </p>
          <input type="file" onChange={this.handleFile} />
        </form>

        <div className="as-submit-footer">
          <Button color="primary" onClick={() => this.changeView("deployInput")}>Next</Button>
        </div>
        
      </div> 
    }
    else{
      dashboard = <div>
        <form>
          <Tabs selectedIndex={this.state.tabIndex} onSelect={tabIndex => this.setState({ tabIndex })}>
            <TabList>
              <Tab>Service</Tab>
              <Tab>Title 2</Tab>
            </TabList>

            <TabPanel>
              <h2>Any content 1</h2>
              <p>Mode: <input type="text" name="mode" defaultValue={this.fetchValue("service.mode")}/></p>
              <p>Multicast Group: <input type="text" name="multicast_group"/></p>
            </TabPanel>
            <TabPanel>
              <h2>Any content 2</h2>
            </TabPanel>
          </Tabs>
        </form>

        <div className="as-submit-footer">
          <Button color="primary" onClick={() => this.changeView("deployHome")}>Back</Button>
          <Button color="primary" >Add Node</Button>
        </div>
        
      </div>  
    }
    return (
        dashboard
      );
  }
}

DeployClusterDashboard.PropTypes = {
  
};

export default DeployClusterDashboard;





