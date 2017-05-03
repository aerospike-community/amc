import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'
import { Dropdown, DropdownMenu, DropdownItem } from 'reactstrap';
import { objectPropType, nextNumber } from '../classes/Util';
import Tree from './Tree';

// Display all the clusters and its entites 
// in a tree.
class EntityTree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contextMenuEntity: null
    };

    this.renderTreeNode = this.renderTreeNode.bind(this);
    this.onEntitySelect = this.onEntitySelect.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
  }

  // called from the Tree component to render a entity
  renderTreeNode(entity) {
    const showContextMenu = this.state.contextMenuEntity === entity;
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
      <div style={style} onClick={(evt) => this.onEntitySelect(entity)} onContextMenu={(evt) => this.onContextMenu(evt, entity)}>
        {entity.name}
        {showContextMenu &&
         <Dropdown isOpen={true} toggle={() => {
                                         }}>
           <DropdownMenu>
             <DropdownItem header>
               {entity.name} </DropdownItem>
             {options.map((option) => {
                return <DropdownItem key={nextNumber()} onClick={(evt) => this.onEntityViewSelect(entity, option)}>
                         {option.label}
                       </DropdownItem>
              })}
           </DropdownMenu>
         </Dropdown>}
      </div>
      );
  }

  onContextMenu(evt, entity) {
    if (evt.ctrlKey)
      return;

    evt.preventDefault();

    this.setState({
      contextMenuEntity: entity
    });
  }

  hideContextMenu() {
    this.setState({
      contextMenuEntity: null
    });
  }

  onEntitySelect(entity) {
    if (this.state.contextMenuEntity !== null) {
      this.hideContextMenu();
      return;
    }

    this.props.onEntitySelect(entity);
  }

  onEntityViewSelect(entity, view) {
    this.hideContextMenu();
    this.props.onEntityViewSelect(entity, view.label);
  }

  render() {
    const clusters = this.props.clusters;
    if (clusters.length === 0) {
      return null;
    }

    return (
      // TODO unique key for each child
      <div>
        {clusters.map(cluster => {
           return (
             <Tree root={cluster} renderNode={this.renderTreeNode} expanded={this.props.expanded} onNodeCollapse={this.props.onNodeCollapse} onNodeExpand={this.props.onNodeExpand}
             />
             );
         })}
      </div>
      );
  }
}

EntityTree.PropTypes = {
  // an array of clusters to display
  clusters: PropTypes.arrayOf(objectPropType(Tree)).isRequired,
  // callback when an entity is selected
  // onEntitySelect(entity)
  onEntitySelect: PropTypes.func,
  // callback when a view is selected for an entity
  // onEntityViewSelect(entity, view)
  onEntityViewSelect: PropTypes.func,

  // state of the entity tree
  // a set of expanded nodes of the tree
  expanded: PropTypes.instanceOf(Set),
  // onNodeExpand(node)
  onNodeExpand: PropTypes.func,
  // onNodeCollapse(node)
  onNodeCollapse: PropTypes.func,
};

export default EntityTree;
