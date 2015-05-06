app.controller('allTasksCtrl', ['$scope', '$http', '$mdSidenav', function ($scope, $http, $mdSidenav) {
    $http.get('models/skills.json').success(function (skills) {
        $scope.skills = skills;
        $http.get('models/tasks_list.json').success(function (tasks) {
            $scope.tasks = tasks;
            $scope.lastExpandedTask = $scope.tasks[Object.keys($scope.tasks)[0]];
            $scope.lastExpandedTask.expanded = false;

            $http.get('models/users.json').success(function (users) {
                $scope.users = users;
            });
        });
    });

    $scope.findUser = function (id) {
        for (var user in $scope.users)
            if ($scope.users[user].id === id) return $scope.users[user];
    };

    $scope.expand = function (task) {
        if ($scope.lastExpandedTask !== task) $scope.lastExpandedTask.expanded = false;
        task.expanded = !task.expanded;
        $scope.lastExpandedTask = task;
    };

    $scope.$watch('taskName', function (newval, oldval) {
        if ($scope.lastExpandedTask) $scope.lastExpandedTask.expanded = false;
    });

    $scope.toggleFilter = function () {
    };

    $scope.closeFilter = function () {
    };
}]);

app.controller('oneTaskCtrl', ['$rootScope', '$scope', '$routeParams', '$http', 'navbarSelectedIndex',
    function ($rootScope, $scope, $routeParams, $http, navbarSelectedIndex) {
        $http.get('models/skills.json').success(function (skills) {
            $scope.skills = skills;
            $http.get('models/tasks_list.json').success(function (tasks) {
                $scope.tasks = tasks;
                $scope.task = tasks[$routeParams.task_id];
                $http.get('models/users.json').success(function (users) {
                    $scope.users = users;
                    for (var user in users)
                        if (users[user].id === $scope.task.author) $scope.author = users[user];
                });
            });
        });

        $scope.selectedIndex = 0;
        $scope.next = function () {
            $scope.selectedIndex = Math.min($scope.selectedIndex + 1, 2);
        };
        $scope.previous = function () {
            $scope.selectedIndex = Math.max($scope.selectedIndex - 1, 0);
        };

        $scope.goToAuthor = function () {
            navbarSelectedIndex.set(3);
        };
    }
]);