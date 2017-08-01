import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Form, FormGroup, Input, Label, Table } from 'reactstrap';

import { createUser, updateUser, deleteUser } from 'api/clusterUsers';
import { getRoles } from 'api/clusterRoles';
import Spinner from 'components/Spinner';
import AlertModal from 'components/AlertModal';

// EditClusterUser is a component to edit a cluster role
class EditClusterUser extends React.Component {
  constructor(props) {
    super(props);

    const roles = props.roles || [];
    this.state = {
      inProgress: false,
      errorMessage: '',
      showSuccess: false,
      showDeleteSuccess: false,
      showWarnings: false, // show form warnings
      confirmDelete: false,

      name: props.name,
      password: '',
      roles: roles.slice(), // copy

      allRoles: [], // all the possible roles
    };

    this.renderPrivileges = this.renderPrivileges.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    const { clusterID } = this.props;
    getRoles(clusterID)
      .then((roles) => {
        this.setState({
          allRoles: roles
        });
      });
  }

  isEdit() {
    return !this.isCreate();
  }

  isCreate() {
    return this.props.isCreate;
  }

  onInputChange(evt) {
    const { name, value } = evt.target;
    this.setState({
      [name]: value
    });
  }

  getSaveFunction() {
    const { name, password, roles } = this.state;
    const { clusterID } = this.props;

    if (this.isCreate()) {
      return () => {
        return createUser(clusterID, name, password, roles);
      };
    }

    const diff = (arr1, arr2) => {
      const d = [];
      arr1.forEach((a) => {
        const i = arr2.findIndex((b) => b === a);
        if (i === -1)
          d.push(a);
      });
      return d;
    };

    const p = this.props;
    const added = diff(roles, p.roles);
    const revoked = diff(p.roles, roles);
    return () => {
      return updateUser(clusterID, name, password, added, revoked);
    };
  }

  onSave() {
    const { name, password } = this.state;
    const isCreate = this.isCreate();

    if (!name || (isCreate && !password)) {
      this.setState({
        showWarnings: true
      });
      return;
    }

    this.setState({
      inProgress: true
    });

    const fn = this.getSaveFunction();
    fn()
      .then(() => {
        this.setState({
          inProgress: false,
          showSuccess: true
        });

        window.setTimeout(() => {
          this.setState({
            showSuccess: false
          });
          this.props.onSaveSuccess();
        }, 4000);
      })
      .catch((message) => {
        this.setState({
          inProgress: false,
          errorMessage: message
        });
      });
  }

  onDelete() {
    this.setState({
      confirmDelete: true
    });
  }

  deleteUser() {
    this.setState({
      inProgress: true
    });

    const { clusterID, name } = this.props;
    deleteUser(clusterID, name)
      .then(() => {
        this.setState({
          inProgress: false,
          showDeleteSuccess: true
        });

        window.setTimeout(() => {
          this.setState({
            showDeleteSuccess: false
          });
          this.props.onSaveSuccess();
        }, 4000);
      })
      .catch((error) => {
        console.trace(error);
      });
  }

  onCancel() {
    this.props.onCancel();
  }

  renderPrivileges(role, key) {
    const group = groupRoles(role.roles);
    return (
      <ul className="list-unstyled">
      {group.map((p, i) => {
        const { namespace, set, privileges } = p;
        const style = { fontWeight: 'bold', paddingRight: 5 };
        return (
          <li key={role.name+'_'+(key+i)}>
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
    );

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
  }

  renderRoles() {
    const { roles, allRoles } = this.state;

    const onChange = (evt) => {
      const { name, checked } = evt.target;
      const roles = this.state.roles.slice(); // copy
      const i = roles.findIndex((r) => r === name);
      if (i === -1)
        roles.push(name);
      else
        roles.splice(i, 1);

      this.setState({
        roles: roles
      });
    };

    return (
      <Table size="sm" bordered hover>
        <thead>
          <tr>
            <th> Role </th>
            <th> Privileges </th>
          </tr>
        </thead>

        <tbody>
        {allRoles.map((role, i) => {
          const { name } = role;
          const isPresent = roles.find((r) => r === name);
          return (
            <tr key={'role'+name}>
              <td>
                <FormGroup check>
                  <Label check> 
                    <Input type="checkbox" name={name} checked={isPresent} onChange={onChange} /> {' '}
                    {name}
                  </Label>
                </FormGroup>
              </td>
              <td>
                {this.renderPrivileges(role, i)}
              </td>
            </tr>
          );
        })}
        </tbody>
      </Table>
    );
  }

  renderDelete() {
    const { showDeleteSuccess, confirmDelete, name } = this.state;

    if (showDeleteSuccess) {
      const msg = `Successfuly deleted user ${name}`;
      return <AlertModal header="Success" type="success" message={msg} />
    }

    if (confirmDelete) {
      const cancel = () => {
        this.setState({
          confirmDelete: false
        });
      };
      const ok = () => {
        cancel();
        this.deleteUser();
      };

      const header = 'Confirm';
      const msg = `Delete user ${name}`;
      return <AlertModal onOK={ok} onCancel={cancel} header={header} message={msg} type="error" />
    }

    return null;
  }

  render() {
    const { name, password, inProgress }  = this.state;
    const { errorMessage, showSuccess, showWarnings } = this.state;
    const isEdit = this.isEdit();
    const msg = isEdit ? `Successfuly edited ${name}` : `Successfuly created user ${name}`;

    const nameWarning = showWarnings && !name;
    const passwordWarning = showWarnings && !password;
    return (
      <div>
        <Form>
          <FormGroup color={nameWarning ? 'warning': ''}>
            <Label> Name </Label>
            <Input disabled={isEdit} type="text" name="name" onChange={this.onInputChange} value={name} 
              state={nameWarning ? 'warning' : ''} />
          </FormGroup>

          <FormGroup color={passwordWarning ? 'warning': ''}>
            <Label> Password </Label>
            <Input type="password" name="password" onChange={this.onInputChange} value={password} 
              placeholder={isEdit ? 'Leave it blank if not updating' : 'Password'}
              state={passwordWarning ? 'warning' : ''} />
          </FormGroup>

          {this.renderRoles()}

          <div className="as-submit-footer">
            <Button disabled={inProgress} color="primary" onClick={this.onSave}> Save </Button>
            {isEdit && <Button disabled={inProgress} color="danger" onClick={this.onDelete}> Delete </Button>}
            <Button disabled={inProgress} color="secondary" onClick={this.onCancel}> Cancel </Button>
            {inProgress &&
             <span> <Spinner /> Saving ... </span>}
            {errorMessage &&
             <span className="as-error-text"> {errorMessage} </span>}
          </div>
        </Form>

        {showSuccess &&
          <AlertModal header="Success" type="success" message={msg} />
        }
        
        {this.renderDelete()}
      </div>
    );
  }
}

EditClusterUser.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // is it an edit or create
  isCreate: PropTypes.bool,

  // options for edit only
  // name of the role
  name: PropTypes.string,
  // roles of the user
  roles: PropTypes.arrayOf(PropTypes.string),

  // callback on save success
  // onSaveSuccess(name, roles)
  onSaveSuccess: PropTypes.func,
  // callback on cancel
  onCancel: PropTypes.func,
};

export default EditClusterUser;

