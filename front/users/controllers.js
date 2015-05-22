app.controller('usersListCtrl', function ($scope, $http, $filter) {
    $scope.username = "";
    $scope.filteredUsers = [];

    $http.get('models/users.json').success(function (data) {
        $scope.users = data;
        $scope.lastExpandedUser = $scope.users[0];
    });
    $http.get('/models/skills.json').success(function (data) {
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

app.controller('profileCtrl', function ($scope, $routeParams, $http) {
        $http.get('models/users.json').success(function (data) {
            $scope.users = data;
            $scope.user = data[$routeParams.user_id];
        });
        $http.get('models/skills.json').success(function (data) {
            $scope.skills = data;
        });
        $http.get('models/tasks_list.json').success(function (data) {
            $scope.tasks = data;
        });
        $http.get('models/solutions.json').success(function (data) {
            $scope.solutions = data;
        });
        $scope.tabSelected = 0;

        $scope.findUser = function (id) {
            for (var user in $scope.users)
                if ($scope.users[user].id === id) return $scope.users[user];
        };
    }
);

app.controller('registrationCtrl', function ($scope, $routeParams, $http, $location) {
        $scope.register = function() {
            $http.post('/register', { email: $scope.email, password: $scope.password })
                .success(function (data) {
                    $location.path(data);
                    alert('You registered and logged in!');
                });
        }
    }
);
app.controller('loginCtrl', function ($scope, $routeParams, $http, $location) {
        $scope.login = function() {
            $http.post('/login', { email: $scope.email, password: $scope.password })
                .success(function (data) {
                    $location.path(data);
                    alert('You logged in!');
                });
        }
    }
);