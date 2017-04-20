import React from 'react';
import PropTypes from 'prop-types';
import { objectPropType, nextNumber } from '../classes/Util';

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/common.css';

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
    this.props.onNodeClick(this.props.node);
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
  depth: PropTypes.number,
  onNodeClick: PropTypes.func,
  renderNode: PropTypes.func,

  node: PropTypes.shape({
    label: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    children: PropTypes.arrayOf(objectPropType(Tree)).isRequired,
  }),
};

export default Tree;
