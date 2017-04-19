import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types'
import { objectPropType, nextNumber } from '../classes/Util';
import Tree from './Tree';

class Clusters extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const clusters = this.props.clusters;
    if (clusters.length === 0) {
      return null;
    }

    return (
      <div>
        { clusters.map(node => <Tree node={ node } depth={ 0 } key={ nextNumber() } onNodeClick={ this.props.onNodeClick } />
          ) }
      </div>
      );
  }
}

Clusters.PropTypes = {
  clusters: PropTypes.arrayOf(objectPropType(Tree)).isRequired
};

export default Clusters;
