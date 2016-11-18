var services = angular.module('aerospike.stellar.services', ['ngResource']);

services
.factory('AccountsService', ['$resource',
    function ($resource) {
        return $resource('/api/v1/accounts/:id/:cmd', {
            id: '@id',
            cmd: '@cmd'
        }, {
            'notifications': {
                method: 'GET',
                isArray: true
            }
        });
    }
])
.factory('NotificationsService', ['$resource',
    function ($resource) {
        return $resource('/api/v1/notifications', {}, {
            'index': {
                method: 'GET',
                isArray: true
            }
        });
    }
])
    .factory('ClustersService', ['$resource',
        function ($resource) {
            return $resource('/api/v1/clusters/:id', {id: '@id'}, {
                'create': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                },
                'save': {
                    method: 'POST',
                },
                'index': {
                    method: 'GET',
                    isArray: true
                },
                'show': {
                    method: 'GET',
                    isArray: false
                },
                'update': {
                    method: 'PUT'
                },
                'destroy': {
                    method: 'DELETE',
                    isArray: false,
                }
            });
        }
    ])
    .factory('SnapshotsService', ['$resource',
        function ($resource) {
            return $resource('/api/v1/snapshots', {}, {
                'index': {
                    method: 'GET',
                    isArray: true
                },
            });
        }
    ])
    .factory('DbUsersService', ['$resource',
        function ($resource) {
            return $resource('/api/v1/clusters/:id/dbusers/:user_id', {
                id: '@id',
                user_id: '@user_id'
            }, {
                'create': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                },
                'index': {
                    method: 'GET',
                    isArray: true
                },
                'show': {
                    method: 'GET',
                    isArray: false
                },
                'update': {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                },
                'destroy': {
                    method: 'DELETE'
                }
            });
        }
    ])
    .factory('ClusterCommandsService', ['$resource',
        function ($resource) {
            return $resource('/api/v1/clusters/:id/:cmd', {
                id: '@id'
            }, {
                'stats': {
                    method: 'GET',
                    params: {
                        cmd: 'stats'
                    },
                    isArray: false
                },
                'backup': {
                    method: 'POST',
                    params: {
                        cmd: 'backup',
                        label: '@label',
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    isArray: false
                },
                'restore': {
                    method: 'POST',
                    params: {
                        cmd: 'restore',
                        snapshot_id: '@snapshot_id',
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    isArray: false
                },
                'destroy': {
                    method: 'GET',
                    params: {
                        cmd: 'destroy'
                    },
                    isArray: false
                }
            });
        }
    ])
    .factory('ProvidersService', ['$resource',
        function ($resource) {
            return $resource('/api/v1/providers', {}, {
                'index': {
                    method: 'GET',
                    isArray: true
                },
            });
        }
    ])
    .factory('PlansService', ['$resource',
        function ($resource) {
            return $resource('/api/v1/plans', {}, {
                'index': {
                    method: 'GET',
                    isArray: true
                },
            });
        }
    ])
    .service('modalService', ['$modal',
        function ($modal) {

            var modalDefaults = {
                backdrop: true,
                keyboard: true,
                modalFade: true,
                templateUrl: 'views/partials/modal.html'
            };

            var modalOptions = {
                closeButtonText: 'Close',
                actionButtonText: 'OK',
                headerText: 'Proceed?',
                bodyText: 'Perform this action?'
            };

            this.showModal = function (customModalDefaults, customModalOptions) {
                if (!customModalDefaults) customModalDefaults = {};
                customModalDefaults.backdrop = 'static';
                return this.show(customModalDefaults, customModalOptions);
            };

            this.show = function (customModalDefaults, customModalOptions) {
                //Create temp objects to work with since we're in a singleton service
                var tempModalDefaults = {};
                var tempModalOptions = {};

                //Map angular-ui modal custom defaults to modal defaults defined in service
                angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

                //Map modal.html $scope custom properties to defaults defined in service
                angular.extend(tempModalOptions, modalOptions, customModalOptions);

                if (!tempModalDefaults.controller) {
                    tempModalDefaults.controller = function ($scope, $modalInstance) {
                        $scope.modalOptions = tempModalOptions;
                        $scope.modalOptions.ok = function (result) {
                            $modalInstance.close(result);
                        };
                        $scope.modalOptions.close = function (result) {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                }

                return $modal.open(tempModalDefaults)
                    .result;
            };

        }
    ])
    .factory('authService', ['$resource', '$cookieStore',
        function ($resource, $cookies) {
            var Login = $resource('/api/v1/login', {}, {
                'perform': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                },
            });

            var ResetPassword = $resource('/api/v1/reset-password', {}, {
                'perform': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                },
            });

            var RequestResetPassword = $resource('/api/v1/request-reset-password', {}, {
                'perform': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                },
            });

            var Register = $resource('/api/v1/register', {
                email: '@email',
                confirmation_token: '@confirmation_token'
            }, {
                'perform': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                },
                'activate': {
                    method: 'GET',
                },
            });

            var Profile = $resource('/api/v1/profile', {});
            var Logout = $resource('/api/v1/logout', {});

            var destroySession = function () {
                $cookies.remove('burrow-service-session');
                $cookies.remove('accountId');
                $cookies.remove('profile');
            }

            var setupSession = function (success, failure) {
                // set current accountId
                Profile.get()
                    .$promise.then(
                        function (profile) {
                            $cookies.put('profile', profile);
                            $cookies.put('accountId', profile.accounts[0].id);

                            if (success) {
                                success(profile)
                            };
                        },
                        function (error) {
                            if (failure) {
                                failure(error)
                            };
                        }
                )
            };

            return {
                login: function (email, password, success, failure) {
                    destroySession();
                    
                    Login.perform($.param({
                        email: email,
                        password: password,
                    }))
                        .$promise.then(
                            function () {
                                // set current accountId
                                setupSession(success, failure);
                            },
                            function (error) {
                                failure(error);
                            }
                    );

                },
                setupSession: function (success, failure) {
                    setupSession(success, failure);
                },
                logout: function (success, failure) {
                    Logout.save()
                        .$promise.then(success, failure);
                },
                resetPassword: function (email, token, password1, password2, success, failure) {
                    ResetPassword.perform($.param({
                        email: email,
                        token: token,
                        password_new1: password1,
                        password_new2: password2,
                    }))
                        .$promise.then(
                            function (message) {
                                success(message);
                            },
                            function (error) {
                                failure(error)
                            }
                    );
                },
                requestResetPassword: function (email, success, failure) {
                    RequestResetPassword.perform($.param({
                        email: email,
                    }))
                        .$promise.then(
                            function (message) {
                                success(message);
                            },
                            function (error) {
                                failure(error)
                            }
                    );

                },
                register: function (email, password, success, failure) {
                    Register.perform($.param({
                        email: email,
                        password: password,
                    }))
                        .$promise.then(
                            function (message) {
                                success(message);
                            },
                            function (error) {
                                failure(error);
                            }
                    )
                },
                activate: function (email, confirmation_token, success, failure) {
                    Register.activate({
                        email: email,
                        confirmation_token: confirmation_token,
                    })
                        .$promise.then(
                            function (message) {
                                success(message);
                            },
                            function (error) {
                                failure(error);
                            }
                    );

                },
                isLoggedIn: function () {
                    return $cookies.get('profile') ? true : false
                },
                currentUser: function () {
                    return $cookies.get('profile')
                }
            };
        }
    ])
    .factory('AccountService', ['$resource',
        function ($resource) {
            return $resource('/api/v1/profile', {
                cmd: '@cmd'
            }, {
                'show': {
                    method: 'GET',
                    isArray: false
                },
                'update': {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                },
            });
        }
    ]);
