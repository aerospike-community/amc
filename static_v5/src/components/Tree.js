import React from 'react';
import PropTypes from 'prop-types';
import { objectPropType, nextNumber } from '../classes/Util';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

// Render a Tree view
class Tree extends React.Component {
  constructor(props) {
    super(props);

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onNodeClick = this.onNodeClick.bind(this);
  }

  onToggleCollapse(node) {
    const expanded = this.props.expanded;
    let fn;
    if (expanded.has(node))
      fn = this.props.onNodeCollapse;
    else
      fn = this.props.onNodeExpand;

    const type = typeof fn;
    if (type === 'function')
      fn(node);
    else
      console.warn(`Tree - onNodeCollapse/onNodeExpand not a function, is of type ${type}`);
  }

  onNodeClick(node) {
    const fn = this.props.onNodeClick;
    const type = typeof fn;
    if (type === 'function')
      fn(this.node);
    else
      console.warn(`Tree - onNodeClick not a function, is of type ${type}`);
  }

  renderTree(node, depth) {
    const expanded = this.props.expanded.has(node);
    const renderNode = this.props.renderNode;
    const {label, children} = node;
    const style = {
      marginLeft: depth * 10,
      cursor: 'pointer',
    };
    let tree = (
    <div key={label}>
      <div>
        <span className={expanded ? 'as-arrow-down' : 'as-arrow-right'} style={style} onClick={() => this.onToggleCollapse(node)} />
        {typeof renderNode === 'function' ? renderNode(node) :
         <span onClick={this.onNodeClick}> {label} </span>}
      </div>
      <div>
        {expanded &&
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
  if (!node.hasOwnProperty('label') || !node.hasOwnProperty('children'))
    return false;
  if (typeof node.label !== 'string')
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
  // callback to render the node (optional)
  // can customise how the node looks in the tree
  renderNode: PropTypes.func,

  // a set of expanded nodes of the tree
  expanded: PropTypes.instanceOf(Set),
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