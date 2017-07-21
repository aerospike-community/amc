import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { objectPropType, nextNumber } from '../classes/util';

// Render a Tree view
class Tree extends React.Component {
  constructor(props) {
    super(props);

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onNodeClick = this.onNodeClick.bind(this);
  }

  onToggleCollapse(node) {
    const isExpanded = this.props.isExpanded(node);
    if (isExpanded)
      this.props.onNodeCollapse(node);
    else
      this.props.onNodeExpand(node);
  }

  onNodeClick(node) {
    this.props.onNodeClick(this.node);
  }

  renderTree(node, depth) {
    const expanded = this.props.isExpanded(node);
    const renderNode = this.props.renderNode;
    const {name, children} = node;
    const hasChildren = Array.isArray(children) && children.length > 0;
    const isSelected = this.props.isNodeSelected(node);
    const style = {
      marginLeft: depth * 10,
    };
    const key = depth + '_' + name;
    let tree = (
    <div key={key}>
      <div style={style} className={classNames('as-tree-list-item', 'as-selectable', {
                                                'as-selected': isSelected, 
                                                'as-tree-root': depth === 0})}>
        <div onClick={() => this.onToggleCollapse(node)}>
          {hasChildren && expanded &&
            <span className="as-arrow-down"></span>}
          {hasChildren && !expanded &&
            <span className="as-arrow-right"></span>}
          {!hasChildren &&
            <span> &nbsp; </span>}
        </div>

        {typeof renderNode === 'function' ? renderNode(node) :
         <span onClick={this.onNodeClick} title={name}> {name} </span>}
      </div>

      <div>
        {hasChildren && expanded &&
         children.map((node, i) => this.renderTree(node, depth + 1)
         )}
      </div>
    </div>
    );
    return tree;
  }

  render() {
    const depth = 0;
    return (
    this.renderTree(this.props.root, depth)
    )
  }
}

function isNodeValid(node) {
  if (typeof node.name !== 'string')
    return false;
  if (!Array.isArray(node.children))
    return false;
  for (let i = 0; i < node.children.length; i++) {
    if (!isNodeValid(node.children[i]))
      return false;
  }
  return true;
}

Tree.propTypes = {
  // onNodeExpand(node)
  onNodeExpand: PropTypes.func,
  // onNodeCollapse(node)
  onNodeCollapse: PropTypes.func,
  // onNodeClick(node)
  onNodeClick: PropTypes.func,
  // callback to render the node
  // can customise how the node looks in the tree
  renderNode: PropTypes.func,

  // return true if the node is selected
  isNodeSelected: PropTypes.func,
  // returns true if the node is expaned
  // isExpanded(treeNode)
  isExpanded: PropTypes.func,
  // the root
  root: function(props, propName, componentName) {
    let node = props[propName];
    if (!isNodeValid(node)) {
      return new Error(
        'Invalid prop `' + propName + '` supplied to' +
        ' `' + componentName + '`. Validation failed.'
      );
    }
  }
};

export default Tree;
