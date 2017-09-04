import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import { getUsers } from 'api/clusterUsers';
import Spinner from 'components/Spinner';

// ClusterUsers displays all the users in the cluster
class ClusterUsers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      users: []
    };

    this.renderUser = this.renderUser.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const id = nextProps.clusterID;
    if (this.props.clusterID !== id)
      this.fetchUsers(id);
  }

  fetchUsers(clusterID) {
    this.setState({ isFetching: true });
    getUsers(clusterID)
      .then((users) => {
        this.setState({
          isFetching: false,
          users: users
        });
      });
  }

  componentWillMount() {
    const { clusterID } = this.props;
    this.fetchUsers(clusterID);
  }

  renderUser(user) {
    const { username, roles } = user;
    const { onUserSelect } = this.props;
    const showEdit = typeof(onUserSelect) === 'function';

    const onClick = () => {
      if (showEdit) 
        onUserSelect(user);
    };
    return (
      <tr key={username} onClick={onClick} className="as-cursor-pointer">
        <td> {username} <i className="fa fa-pencil fa-1x" /> </td>
        <td> {roles.join(', ')} </td>
      </tr>
    );
  }

  render() {
    const { users, isFetching } = this.state;

    if (isFetching)
      return <Spinner />;

    return (
      <Table size="sm" bordered hover>
        <thead> 
          <tr>
            <th> Name </th>
            <th> Roles </th>
          </tr>
        </thead>
        <tbody>
          {users.map(this.renderUser)}
        </tbody>
      </Table>
    );
  }
}

ClusterUsers.PropTypes = {
  clusterID: PropTypes.string,
  // (optional) callback on selecting a user
  // onUserSelect(role)
  onUserSelect: PropTypes.func,
};

export default ClusterUsers;
