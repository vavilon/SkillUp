app.controller('usersListCtrl', function ($scope, $http, $filter) {
    $scope.username = "";
    $scope.filteredUsers = [];

    $http.get('db/users').success(function (data) {
        $scope.users = data;
        $scope.lastExpandedUser = $scope.users[0];
    });
    $http.get('db/skills').success(function (data) {
        $scope.skills = data;
    });

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
        $http.get('db/users').success(function (data) {
            $scope.users = data;
            $scope.user = getObjByID($routeParams.user_id, $scope.users);
        });
        $http.get('db/skills').success(function (data) {
            $scope.skills = data;
        });
        $http.get('db/tasks').success(function (data) {
            $scope.tasks = data;
        });
        $http.get('db/solutions').success(function (data) {
            $scope.solutions = data;
        });
        $scope.tabSelected = 0;

        $scope.findSkill = function (id) {
            return getObjByID(id, $scope.skills);
        };
    }
);

app.controller('registrationCtrl', function ($scope, $routeParams, $http, $location, getIsLoggedIn,
                                             $mdToast, $animate) {
        $scope.reg = {};

        $scope.reg.nick = $routeParams.nick === '0' ? '' : $routeParams.nick;
        $scope.reg.email = $routeParams.email === '0' ? '' : $routeParams.email;
        $scope.reg.password = $routeParams.password === '0' ? '' : $routeParams.password;

        $scope.toastPosition = {
            bottom: false,
            top: true,
            left: false,
            right: true
        };
        $scope.getToastPosition = function () {
            var s = Object.keys($scope.toastPosition)
                .filter(function (pos) {
                    return $scope.toastPosition[pos];
                })
                .join(' ');
            console.log(s);
            return s;
        };

        $scope.showSimpleToast = function () {
            $mdToast.show(
                $mdToast.simple()
                    .content('Вы успешно зарегистрированы!')
                    .position($scope.getToastPosition())
                    .hideDelay(3000)
            );
        };

        $scope.passwordsEqual = function() {
            var err = {notequal: false};
            if (!$scope.reg.password) return err;
            if (!$scope.reg.rePassword) return err;
            if ($scope.reg.password !== $scope.reg.rePassword) err.notequal = true;
            return err;
        };

        $scope.checkRegInput = function() {
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
                    getIsLoggedIn(function () {
                        $location.path(data);
                        $scope.showSimpleToast();
                    });
                });
        }
    }
);