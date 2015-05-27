app.controller('allTasksCtrl', function ($scope, $http, $mdSidenav) {
    $http.get('db/skills').success(function (skills) {
        $scope.skills = skills;
        $http.get('db/tasks').success(function (tasks) {
            $scope.tasks = tasks;
            $scope.lastExpandedTask = $scope.tasks[Object.keys($scope.tasks)[0]];
            $scope.lastExpandedTask.expanded = false;

            $http.get('db/users').success(function (users) {
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
});

app.controller('oneTaskCtrl', function ($scope, $routeParams, $http, $rootScope) {
        $http.get('db/skills').success(function (skills) {
            $scope.skills = skills;
            $http.get('db/tasks').success(function (tasks) {
                $scope.tasks = tasks;
                $scope.task = tasks[$routeParams.task_id];
                $http.get('db/users').success(function (users) {
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
    }
);