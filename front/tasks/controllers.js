app.controller('allTasksCtrl', function ($scope, $http, $mdSidenav) {
    $scope.chips.readonlyTasks = false;
    $scope.chips.tasksNames = [];

    $scope.chips.readonlyTasks = false;
    $scope.chips.tasksNames = [];

    $scope.chips.readonlyTasks = false;
    $scope.chips.tasksNames = [];

    $http.get('db/skills').success(function (skills) {
        $scope.skills = skills;
        $http.get('db/tasks').success(function (tasks) {
            $scope.tasks = tasks;
        });
    });

    //TO DO: ЧИПСЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫЫ
    //$scope.watch('chips.tasksNames', function(newVal) {
    //
    //});
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