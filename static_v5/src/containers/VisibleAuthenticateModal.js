import React from 'react';
import { connect } from 'react-redux';
import AuthenticateModal from '../components/AuthenticateModal';
import { authenticate } from '../actions/authenticate';

const mapStateToProps = (state) => {
  const auth = state.session.authentication;
  return {
    inProgress: auth.inProgress,
    failureMessage: auth.failureMessage,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: (credentials) => {
      dispatch(authenticate(credentials));
    },
  };
}

const VisibleAuthenticateModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthenticateModal);

export default VisibleAuthenticateModal;



