import { connect } from 'react-redux';
import { logout } from 'actions/authenticate';
import Header from 'components/Header';

const mapStateToProps = (state) => {
  return {
    userName: state.session.user.name
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onLogout: () => {
      dispatch(logout());
    }
  };
}

const VisibleHeader = connect(
    mapStateToProps,
    mapDispatchToProps,
)(Header);

export default VisibleHeader;


