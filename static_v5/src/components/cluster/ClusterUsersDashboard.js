import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';

import { VIEW_TYPE } from 'classes/constants';
import { USER_ACTIONS, isPermissibleAction } from 'classes/entityActions';
import ClusterUsers from 'components/cluster/ClusterUsers';
import EditClusterUser from 'components/cluster/EditClusterUser';

const LIST_VIEW = 'list';
const EDIT_VIEW = 'edit';
const CREATE_VIEW = 'create';

// ClusterUsersDashboard displays the list, edit and create for a user
class ClusterUsersDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: LIST_VIEW,    // list, edit, create
      editUser: null,     // the user to edit
    };

    const { clusterID } = props;
    this.canCreate = isPermissibleAction(USER_ACTIONS.Create, clusterID, VIEW_TYPE.USER);
    this.canEdit = isPermissibleAction(USER_ACTIONS.Edit, clusterID, VIEW_TYPE.USER);
  }

  toView(view) {
    this.setState({
      view: view
    });
  }

  renderEdit() {
    const { clusterID } = this.props;
    const { username, roles } = this.state.editUser;

    const toListView = () => {
      this.toView(LIST_VIEW);
    };

    return <EditClusterUser clusterID={clusterID} name={username} roles={roles}
            onSaveSuccess={toListView} onCancel={toListView} />;
  }

  renderCreate() {
    const { clusterID } = this.props;
    const toListView = () => {
      this.toView(LIST_VIEW);
    };

    return <EditClusterUser clusterID={clusterID} isCreate={true} onSaveSuccess={toListView} onCancel={toListView} />;
  }

  renderList() {
    const { clusterID } = this.props;
    if (!this.canEdit)
      return <ClusterUsers clusterID={clusterID} />;

    const onUserSelect = (user) => {
      this.setState({
        view: EDIT_VIEW,
        editUser: user
      });
    };

    return <ClusterUsers clusterID={clusterID} onUserSelect={onUserSelect} />
  }

  render() {
    const { view } = this.state;
    let dashboard;

    if (view === CREATE_VIEW)
      dashboard = this.renderCreate();
    else if (view === EDIT_VIEW)
      dashboard = this.renderEdit();
    else 
      dashboard = this.renderList();

    return (
      <div>
        <div className="as-centerpane-header">
          Users

          {this.canCreate && view === LIST_VIEW &&
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

ClusterUsersDashboard.PropTypes = {
  clusterID: PropTypes.string,
};

export default ClusterUsersDashboard;


