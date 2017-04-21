import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'
import { objectPropType, nextNumber } from '../classes/Util';
import Tree from './Tree';
import Dropdown from './Dropdown';

// Display all the clusters and its entites 
// in a tree.
class EntityTree extends React.Component {
  constructor(props) {
    super(props);

    this.renderTreeNode = this.renderTreeNode.bind(this);
    this.onEntitySelect = this.onEntitySelect.bind(this);
  }

  // called from the Tree component to render a entity
  renderTreeNode(entity) {
    const onOptionSelect = (option) => this.onEntityViewSelect(entity, option);
    const onLabelClick = () => this.onEntitySelect(entity);
    const style = {
      display: 'inline-block',
      marginLeft: '5px'
    };
    // TODO options based on entity type
    const options = [{
      label: 'Connect'
    }, {
      label: 'Disconnect'
    }];

    return (
      <Dropdown options={options} label={entity.label} style={style} onOptionSelect={onOptionSelect} onLabelClick={onLabelClick}
      />
      );
  }

  onEntitySelect(entity) {
    const fn = this.props.onEntitySelect;
    const type = typeof fn;
    if (type === 'function')
      fn(entity);
    else
      console.warn(`EntityTree - onEntitySelect is not a function, is of type ${type}`);
  }

  onEntityViewSelect(entity, view) {
    const fn = this.props.onEntityViewSelect;
    const type = typeof fn;
    if (type === 'function')
      fn(entity, view.label);
    else
      console.warn(`EntityTree - onEntityViewSelect is not a function, is of type ${type}`);
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

EntityTree.PropTypes = {
  // an array of clusters to display
  clusters: PropTypes.arrayOf(objectPropType(Tree)).isRequired,
  // callback when an entity is clicked
  // onEntitySelect(entity)
  onEntitySelect: PropTypes.func,
  // callback when a view is selected for an entity
  // onEntityViewSelect(entity, view)
  onEntityViewSelect: PropTypes.func
};

export default EntityTree;
