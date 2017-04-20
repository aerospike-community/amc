import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'
import { objectPropType, nextNumber } from '../classes/Util';
import Tree from './Tree';
import Dropdown from './Dropdown';

class Clusters extends React.Component {
  constructor(props) {
    super(props);

    this.renderTreeNode = this.renderTreeNode.bind(this);
  }

  // called from the Tree component to render a node
  renderTreeNode(node) {
    const onOptionSelect = (option) => this.onTreeNodeOptionSelect(node, option);
    const onLabelClick = () => this.props.onEntityClick(node);
    const style = {
      display: 'inline-block',
      marginLeft: '5px'
    };
    // TODO options based on node type
    const options = [{
      label: 'Connect'
    }, {
      label: 'Disconnect'
    }];

    return (
      <Dropdown options={options} label={node.label} style={style} onOptionSelect={onOptionSelect} onLabelClick={onLabelClick}
      />
      );
  }

  onTreeNodeOptionSelect(node, option) {
    // TODO change state
    console.log(node + ' ' + option);
    this.props.onViewClick(node, option.label);
  }

  render() {
    const clusters = this.props.clusters;
    if (clusters.length === 0) {
      return null;
    }

    return (
      <div>
        {clusters.map(node => {
           return <Tree node={node} depth={0} key={nextNumber()} renderNode={this.renderTreeNode} />
         })}
      </div>
      );
  }
}

Clusters.PropTypes = {
  clusters: PropTypes.arrayOf(objectPropType(Tree)).isRequired,
  onEntityClick: PropTypes.func,
  onViewClick: PropTypes.func
};

export default Clusters;
