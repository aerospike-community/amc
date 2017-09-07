import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';

import { createRole, updateRole, deleteRole } from 'api/clusterRoles';
import Spinner from 'components/Spinner';
import AlertModal from 'components/AlertModal';
import { timeout } from 'classes/util';

// EditClusterRoles is a component to edit a cluster role
class EditClusterRoles extends React.Component {
  constructor(props) {
    super(props);

    const globalRoles = props.globalRoles || [];
    const namespaceRoles = props.namespaceRoles || [];
    this.state = {
      inProgress: false,
      errorMessage: '',
      showSuccess: false,
      showDeleteSuccess: false,
      confirmDelete: false,

      roleName: props.name,
      globalRoles: globalRoles.slice(), // copy
      namespaceRoles: namespaceRoles.slice(), // copy
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
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

  renderGlobalRoles() {
    const groles = this.state.globalRoles;
    const all = ['read', 'read-write', 'read-write-udf', 
                  'data-admin', 'sys-admin', 'user-admin'];

    const onChange = (evt) => {
      const { name, checked } = evt.target;
      const roles = this.state.globalRoles.slice(); // copy
      const i = roles.findIndex((r) => r === name);
      if (i === -1)
        roles.push(name);
      else
        roles.splice(i, 1);

      this.setState({
        globalRoles: roles
      });
    };

    return (
      <FormGroup tag="fieldset">
        <legend className="col-form-legend"> Global Scope </legend>
        {all.map((r) => {
          const isPresent = groles.find((gr) => gr === r);
          return (
            <FormGroup check key={'global_'+r}>
              <Label check> 
                <Input type="checkbox" name={r} checked={isPresent} onChange={onChange} /> {' '}
                {r}
              </Label>
            </FormGroup>
          );
        })}
      </FormGroup>
    );
  }

  renderNamespaceRoles() {
    const { namespaceRoles, showWarnings } = this.state;

    const addNamespaceRole = () => {
      const roles = this.state.namespaceRoles.slice();
      roles.push({
        namespace: '',
        set: '',
        role: 'read'
      });
      this.setState({
        namespaceRoles: roles
      });
    };

    const removeRole = (i) => {
      const roles = this.state.namespaceRoles.slice();
      roles.splice(i, 1);
      this.setState({
        namespaceRoles: roles
      });
    };

    const setRole = (i, role) => {
      const roles = this.state.namespaceRoles.slice();
      roles.splice(i, 1, role);
      this.setState({
        namespaceRoles: roles
      });
    };

    return (
      <FormGroup tag="fieldset">
        <legend className="col-form-legend"> 
          Namespace/Set Scope 
          <Button size="sm" style={{marginLeft: 10}} onClick={addNamespaceRole}> 
            <i className="fa fa-plus"/> Add
          </Button>
        </legend>

        {namespaceRoles.map((r, i) => {
          const isFirst = i === 0;
          const { namespace, set, privilege } = r;
          const onInputChange = (evt) => {
            const { name, value } = evt.target;
            setRole(i, Object.assign({}, {
              namespace: namespace,
              set: set,
              privilege: privilege,
            }, {
              [name]: value
            }));
          };
          const warn = showWarnings && !namespace;

          return (
            <FormGroup key={'namespace'+i} row>
              <FormGroup className="col-xl-3 float-left">
                {isFirst && <Label> Role </Label>}
                <Input type="select" name="privilege" value={privilege} onChange={onInputChange}>
                  <option value="read"> read </option>
                  <option value="read-write"> read-write  </option>
                  <option value="read-write-udf"> read-write-udf </option>
                </Input>
              </FormGroup>
              <FormGroup className="col-xl-3 float-left" color={warn ? 'warning' : ''}>
                {isFirst && <Label> Namespace </Label>}
                <Input type="text" name="namespace" value={namespace} onChange={onInputChange}
                  state={warn ? 'warning' : ''} />
              </FormGroup>
              <FormGroup className="col-xl-3 float-left">
                {isFirst && <Label> Set </Label>}
                <Input type="text" name="set" value={set} onChange={onInputChange}/>
              </FormGroup>
              <FormGroup className="col-xl-2 float-left">
                <Button style={{marginTop: isFirst ? 37 : 6}} size="sm" onClick={() => removeRole(i)}> 
                  <i className="fa fa-minus" /> Remove 
                </Button>
              </FormGroup>
            </FormGroup>
          );
        })}
      </FormGroup>
    );
  }

  getSaveFunction() {
    const { roleName, globalRoles, namespaceRoles } = this.state;
    const { clusterID } = this.props;

    if (this.isCreate()) {
      return () => {
        return createRole(clusterID, roleName, globalRoles, namespaceRoles);
      };
    }

    let revokedG, addedG, revokedN, addedN;
    const diff = (arr1, arr2) => {
      const d = [];
      arr1.forEach((a) => {
        const i = arr2.findIndex((b) => {
          return a.privilege === b.privilege &&
                 a.namespace === b.namespace &&
                 a.set === b.set;
        });
        if (i === -1)
          d.push(a);
      });
      return d;
    };

    const p = this.props;
    addedG = diff(globalRoles, p.globalRoles);
    addedN = diff(namespaceRoles, p.namespaceRoles);
    revokedG = diff(p.globalRoles, globalRoles);
    revokedN = diff(p.namespaceRoles, namespaceRoles);

    return () => {
      return updateRole(clusterID, roleName, revokedG, addedG, revokedN, addedN);
    };
  }

  isInvalidForm() {
    const { roleName, globalRoles, namespaceRoles } = this.state;
    const isCreate = this.isCreate();

    if (isCreate && !roleName) 
      return true;

    let valid = true;
    namespaceRoles.forEach((role) => {
      if (!role.namespace)
        valid = false;
    });
    return !valid;
  }

  onSave() {
    const { roleName, globalRoles, namespaceRoles } = this.state;

    if (this.isInvalidForm()) {
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

        timeout(() => {
          this.setState({
            showSuccess: false
          });
          this.props.onSaveSuccess(roleName, globalRoles, namespaceRoles);
        }, 4000);
      })
      .catch((message) => {
        this.setState({
          inProgress: false,
          errorMessage: message
        });
      });
  }

  onCancel() {
    this.props.onCancel();
  }

  onDelete() {
    this.setState({
      confirmDelete: true
    });
  }

  deleteRole() {
    this.setState({
      inProgress: true
    });

    const { clusterID, name } = this.props;
    deleteRole(clusterID, name)
      .then(() => {
        this.setState({
          inProgress: false,
          showDeleteSuccess: true
        });

        timeout(() => {
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

  renderDelete() {
    const { showDeleteSuccess, confirmDelete, roleName } = this.state;

    if (showDeleteSuccess) {
      const msg = `Successfuly deleted role ${roleName}`;
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
        this.deleteRole();
      };

      const header = 'Confirm';
      const msg = `Delete role ${roleName}`;
      return <AlertModal onOK={ok} onCancel={cancel} header={header} message={msg} type="error" />
    }

    return null;
  }

  render() {
    const { roleName, inProgress, errorMessage, showSuccess, showWarnings } = this.state;
    const isEdit = this.isEdit();
    const nameWarning = showWarnings && !roleName;

    return (
      <div>
        <Form>
          <FormGroup color={nameWarning ? 'warning': ''}>
            <Label> Name </Label>
            <Input disabled={isEdit} type="text" name="roleName" onChange={this.onInputChange} value={roleName}
              state={nameWarning ? 'warning' : ''} />
          </FormGroup>

          {this.renderGlobalRoles()}

          {this.renderNamespaceRoles()}


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
          <AlertModal header="Success" type="success" message="Successfuly saved" />
        }

        {this.renderDelete()}
      </div>
    );
  }
}

EditClusterRoles.PropTypes = {
  clusterID: PropTypes.string.isRequired,
  // is it an edit or create
  isCreate: PropTypes.bool,

  // options for edit only
  // name of the role
  name: PropTypes.string,
  // global roles of the user
  globalRoles: PropTypes.arrayOf(PropTypes.string),
  // namespace/set roles of the user
  namespaceRoles: PropTypes.arrayOf(PropTypes.object),

  // callback on save success
  // onSaveSuccess(name, globalRoles, namespaceRoles)
  onSaveSuccess: PropTypes.func,
  // callback on cancel
  onCancel: PropTypes.func,
};

export default EditClusterRoles;
