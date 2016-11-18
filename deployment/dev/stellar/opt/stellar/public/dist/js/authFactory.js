/*global angular:true, moment:true, _:true */
(function () {
  'use strict';

  app
    .factory('AuthFactory', AuthFactory);

  AuthFactory.$inject = ['$http', '$state', '$q'];

  function AuthFactory($http, $state, $q) {

    var factory = {
      email: null,
      // userName: null,
      // githubAvatarUrl: null,
      isLoggedIn: isLoggedIn,
      getUserName: getUserName
    };

    return factory;

    function isLoggedIn(redirectToLogin) {
      return $http.get('/api/v1/profile')
        .then(function (res) {
          factory.email = res.email;
          if (res.email === null) {
            if (redirectToLogin !== false) {
              return $state.go('login');
            }
            return false;
          }
          return res;
        });
    }

    function getUserName() {
      if (factory.email === undefined) {
        return factory.isLoggedIn();
      } else {
        return $q.when({
          'email': factory.email,
        });
      }
    }

  }

})();