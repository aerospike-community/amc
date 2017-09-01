import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'
import { Checkbox, Dropdown, DropdownMenu, DropdownItem } from 'reactstrap';
import classNames from 'classnames';

import { VIEW_TYPE } from 'classes/constants';
import { objectPropType, nextNumber, isEntitiesEqual  } from 'classes/util';
import { actions, defaultAction, CLUSTER_ACTIONS } from 'classes/entityActions';
import Tree from 'components/Tree';

// Display all the clusters and its entites 
// in a tree.
class EntityTree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contextMenuEntity: null
    };

    // HACK HACK HACK
    // In Dropdown this.hideContextMenu is called immediately
    // after the right click in Firefox. This prevents the context menu
    // from rendering on Firefox when toggle option is enabled in the
    // Dropdown. Solution is to hide context menu only if it is called 
    // after the lapse of a particular interval of time after the context 
    // menu is shown.
    this.contextMenuShownTime; // time the context menu was last shown

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

  renderAlerts(entity) {
    if (this.isDisconnected(entity))
      return null;

    const { alerts } = this.props;
    const { clusterID } = entity;
    const isCluster = entity.viewType === VIEW_TYPE.CLUSTER;

    let nalerts = 0;
    if (isCluster && alerts[clusterID])
        nalerts = alerts[clusterID].alerts.length;

    if (nalerts === 0)
      return null;

    const onShowAlerts = (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.props.onEntityAction(entity, CLUSTER_ACTIONS.Alerts);
    };

    return (
      <span className="as-alert" onClick={onShowAlerts}> {nalerts} </span>
    );
  }

  // called from the Tree component to render a entity
  renderTreeNode(entity) {
    const showContextMenu = isEntitiesEqual(this.state.contextMenuEntity, entity);
    const options = this.getOptions(entity);
    const isDisconnected = this.isDisconnected(entity);
    const { isCategory } = entity;

    return (
      <div>
        <div style={{width: '90%', position: 'relative'}} 
            className={classNames('float-left', {
                                  'as-disconnected': isDisconnected, 
                                  'as-bold': !isDisconnected && isCategory})}
            onClick={(evt) => this.onEntitySelect(entity)} 
            onContextMenu={(evt) => this.onContextMenu(evt, entity)}>

          {showContextMenu &&
          <div style={{position: 'absolute', top: '90%', width: 0, height: 0}}>
           <Dropdown isOpen={true} toggle={() => {this.hideContextMenu()}}>
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

          <div className="as-tree-node-name" title={entity.name}> 
            {entity.name} 
            {this.renderAlerts(entity)}
          </div>
        </div>
      </div>
      );
  }

  onContextMenu(evt, entity) {
    if (evt.ctrlKey)
      return;

    evt.preventDefault();
    evt.stopPropagation();

    // shown, hide it
    if (this.state.contextMenuEntity) {
      this.hideContextMenu();
      return;
    }

    this.contextMenuShownTime = new Date();
    this.setState({
      contextMenuEntity: entity
    });
  }

  hideContextMenu() {
    // HACK HACK HACK
    // See comment on contextMenuShownTime
    const now = new Date();
    if (now.getTime() - this.contextMenuShownTime.getTime() < 200) 
      return;

    this.setState({
      contextMenuEntity: null,
    });
  }

  isDisconnected(entity) {
    const clusters = this.props.clusters;
    const i = clusters.findIndex((c) => isEntitiesEqual(c, entity));

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
    if (this.state.contextMenuEntity !== null) {
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
             <Tree key={cluster.clusterID} root={cluster} renderNode={this.renderTreeNode} 
                isNodeSelected={this.props.isNodeSelected}
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
  // map of clusterID to alerts
  alerts: PropTypes.object,
  // returns true iff the node is selected
  isNodeSelected: PropTypes.string,
  // callback when an entity is selected
  // onEntitySelect(entity, default)
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
