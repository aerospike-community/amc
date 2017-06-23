import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';

import UDFThroughput from 'components/udf/UDFThroughput';

class UDFOverview extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { clusterID } = this.props;

    return (
      <div>
        <UDFThroughput clusterID={clusterID} />
      </div>
    );
  }
}

UDFOverview.PropTypes = {
  clusterID: PropTypes.string.isRequired,
};

export default UDFOverview;

