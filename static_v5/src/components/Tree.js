import React from 'react';
import PropTypes from 'prop-types';
import { objectPropType, nextNumber } from '../classes/Util';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

// Render a Tree view
class Tree extends React.Component {
  constructor(props) {
    super(props);

    // if treeState is passed in use that
    // else create new tree state
    let expanded = [];
    if (props.treeState) {
      if (Array.isArray(props.treeState.expanded))
        expanded = props.treeState.expanded;
      else
        props.treeState.expanded = expanded;
    }
    this.state = {
      expanded: expanded, // array of expanded nodes
    };

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onNodeClick = this.onNodeClick.bind(this);
  }

  onToggleCollapse(node) {
    const expanded = this.state.expanded
    const i = expanded.findIndex(nd => node === nd);
    if (i === -1)
      expanded.push(node);
    else
      expanded.splice(i, 1);

    this.setState({
      expanded: expanded
    });
  }

  onNodeClick(node) {
    const fn = this.props.onNodeClick;
    const type = typeof fn;
    if (type === 'function')
      this.props.onNodeClick(this.node);
    else
      console.warn(`Tree - onNodeClick not a function, is of type ${type}`);
  }

  renderTree(node, depth) {
    const expanded = this.state.expanded.find(nd => node === nd);
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
    const depth = this.props.depth || 0;
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
  // onNodeClick(node)
  onNodeClick: PropTypes.func,
  // callback to render the node (optional)
  // can customise how the node looks in the tree
  renderNode: PropTypes.func,

  // An object to maintain the state of the tree across redraws.
  // Pass this value only if the parent wants to maintain state across redraws
  treeState: PropTypes.object,
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
