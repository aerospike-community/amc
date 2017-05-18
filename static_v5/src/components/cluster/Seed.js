import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';

class Seed extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {disabled, showWarnings} = this.props;
    const {host, port, tlsName} = this.props.seed;
    const {onClick, name} = this.props.button;
    const hostWarning = showWarnings && !host;
    const portWarning = showWarnings && !port;
    return (
      <div className="row">
        <div disabled={disabled} className={classNames('col-3', {
                                              'has-warning': hostWarning
                                            })}>
          <input className={classNames('form-control', {
                              'form-control-warning': hostWarning
                            })} type="text" name="host" placeholder="Host" onChange={this.props.onInputChange} value={host} />
        </div>
        <div disabled={disabled} className={classNames('col-3', {
                                              'has-warning': portWarning
                                            })}>
          <input className={classNames('form-control', {
                              'form-control-warning': portWarning
                            })} type="number" name="port" placeholder="Port" onChange={this.props.onInputChange} value={port} />
        </div>
        <div className="col-3">
          <input className="form-control" type="text" name="tlsName" placeholder="TLS Name" onChange={this.props.onInputChange} value={tlsName} />
        </div>
        <div className="col-3">
          <Button size="sm" style={{ marginTop: 5 }} onClick={onClick}> {name} </Button>
        </div>
      </div>
      );
  }
}

Seed.PropTypes = {
  button: PropTypes.shape({
    name: PropTypes.string,
    onClick: PropTypes.func
  }),
  disabled: PropTypes.bool,
  seed: PropTypes.shape({
    host: PropTypes.string,
    port: PropTypes.string,
    tlsName: PropTypes.string
  }),
  showWarnings: PropTypes.bool,
  // onInputChange(name, value)
  onInputChange: PropTypes.func,
};

export default Seed;





