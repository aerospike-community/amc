import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import bytes from 'bytes';

import ObjectSizeChart from 'components/ObjectSizeChart';
import TimeToLiveChart from 'components/TimeToLiveChart';

// Histograms displays the object size and time to live
// in a row
class Histograms extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const height = this.props.height || 200;
    const { objectSize, timeToLive } = this.props;
    const ncols = objectSize === null ? 12 : 6;
    const cols = `col-xl-${ncols}`;

    return (
      <div>
        <div className="row">
          <div className="col-xl-12 as-section-header">
            Histograms
          </div>
        </div>
        <div className="row">
          <div className={cols}>
            {objectSize &&
            <ObjectSizeChart objectSize={objectSize} height={height}/>
            }
          </div>
          <div className={cols}>
            <TimeToLiveChart timeToLive={timeToLive} height={height}/>
          </div>
        </div>
      </div>
    );
  }
}

Histograms.PropTypes = {
  objectSize: PropTypes.arrayOf(PropTypes.object),
  timeToLive: PropTypes.arrayOf(PropTypes.object),
  // (optional) height of the charts
  height: PropTypes.number,
};

export default Histograms;



