app.controller('usersListCtrl', function ($scope, $http, $filter, getObjByID) {
    $scope.username = "";
    $scope.filteredUsers = [];

    $http.get('db/users').success(function (data) {
        $scope.users = data;
        $scope.lastExpandedUser = $scope.users[0];
    });
    $http.get('db/skills').success(function (data) {
        $scope.skills = data;
    });

    $scope.findSkill = function (id) {
        return getObjByID(id, $scope.skills);
    };

    var orderBy = $filter('orderBy');

    $scope.order = function (predicate, reverse) {
        $scope.users = orderBy($scope.users, predicate, reverse);
    };

    $scope.order('-exp', false);

    $scope.expand = function (user) {
        if ($scope.lastExpandedUser !== user) $scope.lastExpandedUser.expanded = false;
        user.expanded = !user.expanded;
        $scope.lastExpandedUser = user;
    };

    $scope.$watch('username', function (newval, oldval) {
        if ($scope.lastExpandedUser) $scope.lastExpandedUser.expanded = false;
    });
});

app.controller('profileCtrl', function ($scope, $routeParams, $http, getObjByID) {
        $scope.findTask = function (id) {
            return getObjByID(id, $scope.tasks);
        };

        $scope.findSkill = function (id) {
            return getObjByID(id, $scope.skills);
        };

        $http.get('db/users').success(function (data) {
            $scope.users = data;
            $scope.user = getObjByID($routeParams.user_id, $scope.users);
            $http.get('db/tasks').success(function (data) {
                $scope.tasks = data;
                $scope.tasks_done = [];
                $scope.tasks_checked = [];
                $scope.tasks_approved = [];
                $scope.tasks_created = [];

                if ($scope.user.tasks_done)
                for (var i = 0; i < $scope.user.tasks_done.length; i++) {
                    $scope.tasks_done.push($scope.findTask($scope.user.tasks_done[i]));
                }

                if ($scope.user.tasks_checked)
                for (i = 0; i < $scope.user.tasks_checked.length; i++) {
                    $scope.tasks_checked.push($scope.findTask($scope.user.tasks_checked[i]));
                }

                if ($scope.user.tasks_approved)
                for (i = 0; i < $scope.user.tasks_approved.length; i++) {
                    $scope.tasks_done.push($scope.findTask($scope.user.tasks_approved[i]));
                }

                if ($scope.user.tasks_created)
                for (i = 0; i < $scope.user.tasks_created.length; i++) {
                    $scope.tasks_created.push($scope.findTask($scope.user.tasks_created[i]));
                }
            });
        });
        $http.get('db/skills').success(function (data) {
            $scope.skills = data;
        });
        $http.get('db/solutions').success(function (data) {
            $scope.solutions = data;
        });

        $scope.tabSelected = 0;

    }
);

app.controller('registrationCtrl', function ($scope, $routeParams, $http, $location, getIsLoggedIn,
                                             $mdToast, $animate, $timeout) {
        $scope.reg = {};

        $scope.reg.nick = $routeParams.nick === '0' ? '' : $routeParams.nick;
        $scope.reg.email = $routeParams.email === '0' ? '' : $routeParams.email;
        $scope.reg.password = $routeParams.password === '0' ? '' : $routeParams.password;

        $scope.showSimpleToast = function () {
            $mdToast.show(
                $mdToast.simple()
                    .content('Вы успешно зарегистрированы!')
                    .position('top left')
                    .hideDelay(3000)
            );
        };

        $scope.passwordsEqual = function () {
            var err = {notequal: false};
            if (!$scope.reg.password) return err;
            if (!$scope.reg.rePassword) return err;
            if ($scope.reg.password !== $scope.reg.rePassword) err.notequal = true;
            return err;
        };

        $scope.checkRegInput = function () {
            if ($scope.reg.password !== $scope.reg.rePassword) {

            }
        };

        $scope.register = function () {
            $http.post('/register', {
                nick: $scope.reg.nick,
                name: $scope.reg.name,
                email: $scope.reg.email,
                password: $scope.reg.password
            })
                .success(function (data) {
                    if (!data) {
                        $scope.reg.error = true;
                        $timeout(function () {
                            $scope.reg.error = false;
                        }, 5000);
                        return;
                    }
                    getIsLoggedIn(function () {
                        $location.path(data);
                        $scope.showSimpleToast();
                    });
                });
        }
    }
);