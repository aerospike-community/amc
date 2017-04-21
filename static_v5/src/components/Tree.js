import React from 'react';
import PropTypes from 'prop-types';
import { objectPropType, nextNumber } from '../classes/Util';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

// Render a Tree view
class Tree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: true,
    };

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.onNodeClick = this.onNodeClick.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  onNodeClick() {
    const fn = this.props.onNodeClick;
    const type = typeof fn;
    if (type === 'function')
      this.props.onNodeClick(this.props.node);
    else
      console.warn(`Tree - onNodeClick not a function, is of type ${type}`);
  }

  render() {
    const depth = this.props.depth || 0;
    const collapsed = this.state.collapsed;
    const {label, children} = this.props.node;
    const renderNode = this.props.renderNode;
    const style = {
      marginLeft: depth * 10,
      cursor: 'pointer',
    };

    return (
      <div>
        <div>
          <span className={collapsed ? 'as-arrow-right' : 'as-arrow-down'} style={style} onClick={this.onToggleCollapse} />
          {typeof renderNode === 'function' ? renderNode(this.props.node) :
           <span onClick={this.onNodeClick}> {label} </span>}
        </div>
        <div>
          {!collapsed &&
           children.map(node => {
             return <Tree node={node} depth={depth + 1} key={nextNumber()} onNodeClick={this.props.onNodeClick} renderNode={this.props.renderNode} />
           })}
        </div>
      </div>
      );
  }
}

Tree.propTypes = {
  // depth of the node in the tree
  depth: PropTypes.number,
  // callback when the node is clicked (optional)
  // onNodeClick(node)
  onNodeClick: PropTypes.func,
  // callback to render the node (optional)
  // can customise how the node looks in the tree
  renderNode: PropTypes.func,

  // the node of the tree
  // can have other properties, but these are required
  node: PropTypes.shape({
    label: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    children: PropTypes.arrayOf(objectPropType(Tree)).isRequired,
  }).isRequired,
};

export default Tree;
