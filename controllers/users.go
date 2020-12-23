package controllers

import (
	"net/http"
	"strings"
	"time"

	// log "github.com/sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	"github.com/labstack/echo/v4"

	// ast "github.com/aerospike/aerospike-client-go/types"

	"github.com/aerospike-community/amc/common"
)

func getClusterCurrentUser(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"cluster_id": clusterUUID,
		"username":   cluster.User(),
	})
}

func postClusterChangePassword(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		invalidateSession(c)
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	user := c.FormValue("user")
	currentPass := c.FormValue("old_password")
	newPass := c.FormValue("new_password")

	if err := cluster.UpdatePassword(user, currentPass, newPass); err != nil {
		invalidateSession(c)
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"status": "success"})
}

func getClusterUserRoles(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	res := map[string]interface{}{
		"rolelist": cluster.CurrentUserPrivileges(),
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterAllUsers(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	users := cluster.Users()
	roles := cluster.Roles()

	uList := make([]interface{}, 0, len(users))
	for _, u := range users {
		user := map[string]interface{}{
			"user":  u.User,
			"roles": u.Roles,
		}
		uList = append(uList, user)
	}

	rList := make([]interface{}, 0, len(roles))
	for _, r := range roles {
		privileges := make([]string, 0, len(r.Privileges))
		for _, p := range r.Privileges {
			s := string(p.Code)
			if len(p.Namespace) > 0 {
				s += "." + p.Namespace
			}
			if len(p.SetName) > 0 {
				s += "." + p.SetName
			}
			privileges = append(privileges, s)
		}

		role := map[string]interface{}{
			r.Name: privileges,
		}
		rList = append(rList, role)
	}

	res := map[string]interface{}{
		"status": "success",
		"users":  uList,
		"roles":  rList,
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterAllRoles(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	roles := cluster.Roles()

	rList := make([]interface{}, 0, len(roles))
	for _, r := range roles {
		privileges := make([]string, 0, len(r.Privileges))
		for _, p := range r.Privileges {
			s := string(p.Code)
			if len(p.Namespace) > 0 {
				s += "." + p.Namespace
			}
			if len(p.SetName) > 0 {
				s += "." + p.SetName
			}
			privileges = append(privileges, s)
		}

		role := map[string]interface{}{
			r.Name: privileges,
		}
		rList = append(rList, role)
	}

	res := map[string]interface{}{
		"status": "success",
		"roles":  rList,
	}

	return c.JSON(http.StatusOK, res)
}

func postClusterAddUser(c echo.Context) error {
	form := struct {
		Username string `form:"user"`
		Password string `form:"password"`
		Roles    string `form:"roles"`
	}{}

	c.Bind(&form)
	if len(form.Username) == 0 || len(form.Password) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid user/password."))
	}

	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if err := cluster.CreateUser(form.Username, form.Password, strings.Split(form.Roles, ",")); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postClusterDropUser(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if err := cluster.DropUser(c.Param("user")); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postClusterUpdateUser(c echo.Context) error {
	form := struct {
		User     string `form:"user"`
		Password string `form:"password"`
		Roles    string `form:"roles"`
		OldRoles string `form:"old_roles"`
	}{}

	c.Bind(&form)
	if len(form.User) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid user name"))
	}

	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	added, removed := common.StrDiff(strings.Split(form.OldRoles, ","), strings.Split(form.Roles, ","))

	if len(added) > 0 {
		if err := cluster.GrantRoles(c.Param("user"), added); err != nil {
			return c.JSON(http.StatusOK, errorMap(err.Error()))
		}
	}

	if len(removed) > 0 {
		if err := cluster.RevokeRoles(c.Param("user"), removed); err != nil {
			return c.JSON(http.StatusOK, errorMap(err.Error()))
		}
	}

	if len(form.Password) > 0 {
		if err := cluster.ChangeUserPassword(c.Param("user"), form.Password); err != nil {
			return c.JSON(http.StatusOK, errorMap(err.Error()))
		}
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func privilegeFromString(s string) *as.Privilege {
	switch s {
	case "user-admin":
		return &as.Privilege{Code: as.UserAdmin}

	case "sys-admin":
		return &as.Privilege{Code: as.SysAdmin}

	case "data-admin":
		return &as.Privilege{Code: as.DataAdmin}

	case "read":
		return &as.Privilege{Code: as.Read}

	case "read-write":
		return &as.Privilege{Code: as.ReadWrite}

	case "write":
		return &as.Privilege{Code: as.Write}

	case "read-write-udf":
		return &as.Privilege{Code: as.ReadWriteUDF}
	}

	return nil
}

func parsePrivilegeString(s string) []as.Privilege {
	var res []as.Privilege

	l := strings.Split(s, ",")
	for _, ps := range l {
		var p *as.Privilege
		parts := strings.SplitN(ps, ".", 3)
		if len(parts) > 0 {
			if p = privilegeFromString(parts[0]); p == nil {
				continue
			}
		}
		if len(parts) > 1 {
			p.Namespace = parts[1]
		}
		if len(parts) > 2 {
			p.SetName = parts[2]
		}

		res = append(res, *p)
	}

	return res
}

func postClusterAddRole(c echo.Context) error {
	form := struct {
		Role       string `form:"role"`
		Privileges string `form:"privileges"`
	}{}

	c.Bind(&form)
	if len(form.Role) == 0 || len(form.Privileges) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid role name or privileges."))
	}

	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	privileges := parsePrivilegeString(form.Privileges)
	if err := cluster.CreateRole(form.Role, privileges); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postClusterDropRole(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if err := cluster.DropRole(c.Param("role")); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postClusterUpdateRole(c echo.Context) error {
	form := struct {
		Role          string `form:"role"`
		Privileges    string `form:"privileges"`
		OldPrivileges string `form:"old_privileges"`
	}{}

	c.Bind(&form)
	if len(form.Role) == 0 || len(form.Privileges) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid role name or privileges."))
	}

	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	added, removed := common.StrDiff(strings.Split(form.OldPrivileges, ","), strings.Split(form.Privileges, ","))

	privileges := parsePrivilegeString(strings.Join(added, ","))
	if err := cluster.AddPrivileges(c.Param("role"), privileges); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	privileges = parsePrivilegeString(strings.Join(removed, ","))
	if err := cluster.RemovePrivileges(c.Param("role"), privileges); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}
