import React from 'react';
import PropTypes from 'prop-types'
import { objectPropType, nextNumber } from '../classes/Util';
import '../styles/common.css';

class Tree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: true,
    };

    this.onCollapseToggle = this.onCollapseToggle.bind(this);
    this.onNodeClick = this.onNodeClick.bind(this);
  }

  onCollapseToggle() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  onNodeClick() {
    this.props.onNodeClick(this.props.id);
  }

  render() {
    const depth = this.props.depth || 0;
    const style = {
      marginLeft: depth * 10
    };
    const collapsed = this.state.collapsed;
    const {label, children} = this.props.node;

    return (
      <div>
        <div>
          <span className={ collapsed ? 'as-arrow-right' : 'as-arrow-down' } style={ style } onClick={ this.onCollapseToggle } />
          <span onClick={ this.onNodeClick }> { label } </span>
        </div>
        <div>
          { !collapsed &&
            children.map(node => <Tree node={ node } depth={ depth + 1 } key={ nextNumber() } onNodeClick={ this.props.onNodeClick } />
            ) }
        </div>
      </div>
      );
  }
}

Tree.propTypes = {
  node: PropTypes.shape({
    label: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    children: PropTypes.arrayOf(objectPropType(Tree)).isRequired
  })
};

export default Tree;
