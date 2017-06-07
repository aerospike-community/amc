import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'
import { Checkbox, Dropdown, DropdownMenu, DropdownItem } from 'reactstrap';
import classNames from 'classnames';

import { objectPropType, nextNumber } from 'classes/util';
import { actions, defaultAction } from 'classes/entityActions';
import Tree from 'components/Tree';

// Display all the clusters and its entites 
// in a tree.
class EntityTree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contextMenuEntityPath: null
    };

    this.renderTreeNode = this.renderTreeNode.bind(this);
    this.onEntitySelect = this.onEntitySelect.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
    this.onNodeExpand = this.onNodeExpand.bind(this);
  }

  getUserRoles() {
    return []; // TODO get user roles
  }

  getOptions(entity) {
    const roles = this.getUserRoles();
    let views =  actions(entity.viewType, entity, roles);
    let options = [];
    views.forEach((view) => {
      view.forEach((v) => {
        options.push({
          label: v
        });
      });
      options.push({
        isDivider: true
      });
    });

    options.splice(-1); // remove last divider
    return options;
  }

  // called from the Tree component to render a entity
  renderTreeNode(entity) {
    const showContextMenu = this.state.contextMenuEntityPath === entity.path;
    const options = this.getOptions(entity);
    const isDisconnected = this.isDisconnected(entity);
    const { isCategory } = entity;

    return (
      <div>
        <div className="float-left">
          <input type="checkbox" />
        </div>
        <div style={{width: '90%', position: 'relative'}} 
            className={classNames('float-left', {
                                  'as-disconnected': isDisconnected, 
                                  'as-bold': !isDisconnected && isCategory})}
            onClick={(evt) => this.onEntitySelect(entity)} 
            onContextMenu={(evt) => this.onContextMenu(evt, entity)}>

          {showContextMenu &&
          <div style={{position: 'absolute', top: '90%', width: 0, height: 0}}>
           <Dropdown isOpen={true} toggle={() => {}}>
             <DropdownMenu>
               {options.map((option, i) => {
                  if (option.isDivider)
                    return <DropdownItem key={'divider' + i} divider />;

                  return <DropdownItem key={option.label} onClick={(evt) => this.onContextMenuClick(entity, option.label)}>
                           {option.label}
                         </DropdownItem>
                })}
             </DropdownMenu>
           </Dropdown>
          </div>}

          <div className="as-tree-node-name"> {entity.name} </div>
        </div>
      </div>
      );
  }

  onContextMenu(evt, entity) {
    if (evt.ctrlKey)
      return;

    evt.preventDefault();

    this.setState({
      contextMenuEntityPath: entity.path
    });
  }

  hideContextMenu() {
    this.setState({
      contextMenuEntityPath: null,
    });
  }

  isDisconnected(entity) {
    const clusters = this.props.clusters;
    const i = clusters.findIndex((c) => c.path === entity.path);

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

  getDefaultView(entity) {
    const roles = this.getUserRoles();
    return defaultAction(entity.viewType, entity, roles);
  }

  onEntitySelect(entity) {
    if (this.state.contextMenuEntityPath !== null) {
      this.hideContextMenu();
      return;
    }
    if (this.isDisconnected(entity)) {
      this.showConnect(entity);
      return;
    }

    const view = this.getDefaultView(entity);
    this.props.onEntitySelect(entity, view);
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
             <Tree key={cluster.path} root={cluster} renderNode={this.renderTreeNode} 
                isNodeSelected={(entity) => this.props.selectedEntityPath === entity.path}
                isExpanded={this.props.isExpanded} onNodeCollapse={this.props.onNodeCollapse} onNodeExpand={this.onNodeExpand}
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
  selectedEntityPath: PropTypes.string,
  // callback when an entity is selected
  // onEntitySelect(entity)
  onEntitySelect: PropTypes.func,
  // callback when an action is performed on an entity
  // onEntityAction(entity, action)
  onEntityAction: PropTypes.func,

  // returns true if the node is expaned
  // isExpanded(treeNode)
  isExpanded: PropTypes.func,
  // onNodeExpand(node)
  onNodeExpand: PropTypes.func,
  // onNodeCollapse(node)
  onNodeCollapse: PropTypes.func,
};

export default EntityTree;
