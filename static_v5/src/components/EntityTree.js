import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'
import { Dropdown, DropdownMenu, DropdownItem } from 'reactstrap';
import classNames from 'classnames';

import { objectPropType, nextNumber } from '../classes/util';
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
    this.onNodeExpand = this.onNodeExpand.bind(this);
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
    const isDisconnected = this.isDisconnected(entity);

    return (
      <div style={style} className={classNames({'as-disconnected': isDisconnected})}
          onClick={(evt) => this.onEntitySelect(entity)} onContextMenu={(evt) => this.onContextMenu(evt, entity)}>
        {entity.name}
        {showContextMenu &&
         <Dropdown isOpen={true} toggle={() => {}}>
           <DropdownMenu>
             {options.map((option) => {
                return <DropdownItem key={nextNumber()} onClick={(evt) => this.onContextMenuClick(entity, option.label)}>
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

  isDisconnected(entity) {
    const clusters = this.props.clusters;
    const i = clusters.findIndex((c) => c.id === entity.id);

    if (i === -1) // not a cluster entity
      return false;
    return !entity.isAuthenticated;
  }

  showConnect(entity) {
    this.props.onEntityAction(entity, 'Connect');
  }

  onNodeExpand(entity) {
    if (this.isDisconnected(entity)) {
      this.showConnect(entity);
      return;
    }

    this.props.onNodeExpand(entity);
  }

  onEntitySelect(entity) {
    if (this.state.contextMenuEntity !== null) {
      this.hideContextMenu();
      return;
    }
    if (this.isDisconnected(entity)) {
      this.showConnect(entity);
      return;
    }

    this.props.onEntitySelect(entity);
  }

  onContextMenuClick(entity, action) {
    this.hideContextMenu();
    this.props.onEntityAction(entity, action);
  }

  render() {
    const clusters = this.props.clusters;
    if (clusters.length === 0) {
      return null;
    }

    return (
      <div>
        {clusters.map(cluster => {
           return (
             <Tree key={cluster.id} root={cluster} renderNode={this.renderTreeNode} selectedNode={this.props.selectedEntity}
                expanded={this.props.expanded} onNodeCollapse={this.props.onNodeCollapse} onNodeExpand={this.onNodeExpand}
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
  // the selected entity in the tree
  selectedEntity: PropTypes.object,
  // callback when an entity is selected
  // onEntitySelect(entity)
  onEntitySelect: PropTypes.func,
  // callback when an action is performed on an entity
  // onEntityAction(entity, action)
  onEntityAction: PropTypes.func,

  // state of the entity tree
  // a set of expanded nodes of the tree
  expanded: PropTypes.instanceOf(Set),
  // onNodeExpand(node)
  onNodeExpand: PropTypes.func,
  // onNodeCollapse(node)
  onNodeCollapse: PropTypes.func,
};

export default EntityTree;
