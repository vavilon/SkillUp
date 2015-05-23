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

app.controller('registrationCtrl', function ($scope, $routeParams, $http, $location, getIsLoggedIn) {
        $scope.register = function() {
            $http.post('/register', { email: $scope.email, password: $scope.password })
                .success(function (data) {
                    $location.path(data);
                    getIsLoggedIn();
                    alert('You registered and logged in!');
                });
        }
    }
);
app.controller('loginCtrl', function ($scope, $routeParams, $http, $location, getIsLoggedIn) {
        $scope.login = function() {
            $http.post('/login', { email: $scope.email, password: $scope.password })
                .success(function (data) {
                    $location.path(data);
                    getIsLoggedIn();
                    alert('You logged in!');
                });
        }
    }
);