import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';

import ClusterRoles from 'components/cluster/ClusterRoles';
import EditClusterRoles from 'components/cluster/EditClusterRoles';

const LIST_VIEW = 'list';
const EDIT_VIEW = 'edit';
const CREATE_VIEW = 'create';

// ClusterRolesDashboard displays the list, edit and create for a role
class ClusterRolesDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: LIST_VIEW,    // list, edit, create
      editRole: null,     // the role to edit
    };

    this.toggleCollapse = this.toggleCollapse.bind(this);
  }

  toView(view) {
    this.setState({
      view: view
    });
  }

  toggleCollapse() {
    const { isCollapsed } = this.state;
    this.setState({
      isCollapsed: !isCollapsed
    });
  }

  renderEdit() {
    const isGlobalRole = (role) => {
      const isNull = (x) => x === undefined || x === null;
      const { namespace, set } = role;
      return isNull(namespace) && isNull(set);
    };
    const isNamespaceRole = (role) => !isGlobalRole(role);

    const { editRole } = this.state;
    const { name, roles } = editRole;
    const globalRoles = roles.filter(isGlobalRole);
    const namespaceRoles = roles.filter(isNamespaceRole);

    const { clusterID } = this.props;
    const toListView = () => {
      this.toView(LIST_VIEW);
    };

    return <EditClusterRoles clusterID={clusterID} name={name} 
            globalRoles={globalRoles} namespaceRoles={namespaceRoles} 
            onSaveSuccess={toListView} onCancel={toListView} />;
  }

  renderCreate() {
    const { clusterID } = this.props;
    const toListView = () => {
      this.toView(LIST_VIEW);
    };

    return <EditClusterRoles clusterID={clusterID} isCreate={true} onSaveSuccess={toListView} onCancel={toListView} />;
  }

  renderList() {
    const { clusterID } = this.props;
    const onRoleSelect = (role) => {
      this.setState({
        view: EDIT_VIEW,
        editRole: role
      });
    };

    return <ClusterRoles clusterID={clusterID} onRoleSelect={onRoleSelect} />
  }

  render() {
    const { view, isCollapsed } = this.state;
    let dashboard;

    if (!isCollapsed) {
      if (view === CREATE_VIEW)
        dashboard = this.renderCreate();
      else if (view === EDIT_VIEW)
        dashboard = this.renderEdit();
      else 
        dashboard = this.renderList();
    }

    return (
      <div>
        <div className="as-centerpane-header">
          Roles
          {view === LIST_VIEW &&
          <Button style={{marginLeft: 10}} size="sm" color="primary" onClick={() => this.toView(CREATE_VIEW)}>
            <i className="fa fa-plus" /> Create
          </Button>
          }
        </div>

        {dashboard}
      </div>
    );
  }
}

ClusterRolesDashboard.PropTypes = {
  clusterID: PropTypes.string,
};

export default ClusterRolesDashboard;

