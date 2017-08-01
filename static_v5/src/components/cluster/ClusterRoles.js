import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import { getRoles } from 'api/clusterRoles';
import Spinner from 'components/Spinner';

// ClusterRoles displays all the roles in the cluster
class ClusterRoles extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      privileges: []
    };

    this.renderPrivilege = this.renderPrivilege.bind(this);
  }

  componentWillMount() {
    const { clusterID } = this.props;

    this.setState({ isFetching: true });
    getRoles(clusterID)
      .then((privileges) => {
        this.setState({
          isFetching: false,
          privileges: privileges
        });
      });
  }

  renderPrivilege(role) {
    const group = groupRoles(role.roles);
    const onRoleSelect = () => this.props.onRoleSelect(role);
    return (
      <tr key={role.name} onClick={onRoleSelect} className="as-cursor-pointer">
        <td>
          {role.name} <i className="fa fa-pencil fa-1x" /> 
        </td>
        <td>
          <ul className="list-unstyled">
          {group.map((p, i) => {
            const { namespace, set, privileges } = p;
            const style = { fontWeight: 'bold', paddingRight: 5 };
            return (
              <li key={role.name+'_'+i}>
                {namespace &&
                  <span style={style}> Namespace: {namespace} </span>
                }
                {set &&
                  <span style={style}> Set: {set} </span>
                }
                {privileges.join(', ')}
              </li>
            );
          })}
          </ul>
        </td>
      </tr>
    );
  }

  render() {
    const { privileges, isFetching } = this.state;

    if (isFetching)
      return <Spinner />;

    return (
      <Table size="sm" bordered hover>
        <thead> 
          <tr>
            <th> Name </th>
            <th> Privileges </th>
          </tr>
        </thead>
        <tbody>
          {privileges.map(this.renderPrivilege)}
        </tbody>
      </Table>
    );
  }
}

ClusterRoles.PropTypes = {
  clusterID: PropTypes.string,
  // (optional) callback on selecting a role
  // onRoleSelect(role)
  onRoleSelect: PropTypes.func,
};

export default ClusterRoles;


// group roles by system-wide, namespace, namespace & set
function groupRoles(roles) {
  const arr = [];
  roles.forEach((role) => {
    const { privilege, namespace, set } = role;
    const i = arr.findIndex((r) => r.namespace === namespace && r.set === set);

    if (i === -1) {
      arr.push({
        privileges: [privilege],
        namespace: namespace,
        set: set
      });
    } else {
      const r = arr[i];
      r.privileges.push(privilege);
    }
  });

  return arr;
}
