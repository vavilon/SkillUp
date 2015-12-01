function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);

    return function filterFn(item) {
        return (angular.lowercase(item).indexOf(lowercaseQuery) !== -1);
    };

}

function FiltersFactory(array) {
    return function(query) {
        return query
            ? array.filter(createFilterFor(query))
            : [];
    }
}

function applyAllFilters(scope) {
    var target = [].concat(scope.tasks);
    var temp;

    if(scope.chips.selectedTasks.length) {
        temp = [];
        for(var titleID in scope.chips.selectedTasks) {
            var title = scope.chips.selectedTasks[titleID];
            for(var taskID in target) {
                var task = target[taskID];
                if(task.title === title) temp.push(task);
            }
        }
        target = [].concat(temp);
    }

    if(scope.chips.selectedSkills.length) {
        temp = [];
        for (var titleID in scope.chips.selectedSkills) {
            var title = scope.chips.selectedSkills[titleID];
            for (var taskID in target) {
                var task = target[taskID];
                for (var idS in task.skills) {
                    var skillID = task.skills[idS];
                    if (scope.getObjByID(skillID, scope.skills).title === title) {
                        temp.push(task);
                        break;
                    }
                }
            }
        }
        target = [].concat(temp);
    }

    if(scope.chips.selectedAuthors.length) {
        temp = [];
        for(var nameID in scope.chips.selectedAuthors) {
            var name = scope.chips.selectedAuthors[nameID];
            for(var taskID in target) {
                var task = target[taskID];
                if(scope.getObjByID(task.author, scope.users).name === name) temp.push(task);
            }
        }
        target = [].concat(temp);
    }
    return target;
}

app.controller('allTasksCtrl', function ($scope, $http, getObjByID, loggedUser, setLiked, setReceived, loadTasks,
                                         $rootScope, $location, isLoggedIn) {
    if (!isLoggedIn()) $location.path('/main');
    $rootScope.ajaxCall.promise.then(function () {
        $scope.getObjByID = getObjByID;
        $scope.chips = {};
        $scope.chips.tasksNames = [];
        $scope.chips.skillsNames = [];
        $scope.chips.authorsNames = [];

        $scope.chips.selectedTasks = [];
        $scope.chips.selectedSkills = [];
        $scope.chips.selectedAuthors = [];

        $scope.chips.selectedTask = null;
        $scope.chips.selectedSkill = null;
        $scope.chips.selectedAuthor = null;

        $scope.chips.searchTextTasks = null;
        $scope.chips.searchTextSkills = null;
        $scope.chips.searchTextAuthors = null;

        $scope.fTasks = [];

        $scope.getfTasks = function () {
            return $scope.fTasks;
        };

        $scope.exs = $rootScope.exs;
        for (var item in $scope.exs.skills) {
            $scope.chips.skillsNames.push($scope.exs.skills[item].title);
        }
        $scope.chips.skillsQuerySearch = FiltersFactory($scope.chips.skillsNames);

        $http.get('db/users').success(function (users) {
            $scope.users = users;
            for (var item in users) {
                $scope.chips.authorsNames.push(users[item].name);
            }
            $scope.chips.authorsQuerySearch = FiltersFactory($scope.chips.authorsNames);
        });

        var dbTasksOptions = {filters: {for_solving: true}};
        $http.post('/db/tasks', dbTasksOptions).success(function (tasks) {
            var user = loggedUser();

            setLiked(tasks, user.tasks_liked, true);
            setReceived(tasks, user.tasks_received, true);

            $scope.tasks = tasks;
            dbTasksOptions.offset = $scope.tasks.length;
            $scope.scrollWrap = {loadFunc: loadTasks, callback: $scope.scrollCallback, options: dbTasksOptions};

            for (var item in tasks) {
                $scope.chips.tasksNames.push(tasks[item].title);
            }
            $scope.chips.tasksQuerySearch = FiltersFactory($scope.chips.tasksNames);
            $scope.fTasks = tasks;
        });

        $scope.$watchCollection('chips.selectedTasks', function (newVal) {
            $scope.fTasks = applyAllFilters($scope);
        });

        $scope.$watchCollection('chips.selectedSkills', function (newVal) {
            $scope.fTasks = applyAllFilters($scope);
        });

        $scope.$watchCollection('chips.selectedAuthors', function (newVal) {
            $scope.fTasks = applyAllFilters($scope);
        });

        $scope.scrollCallback = function (data) {
            $scope.tasks = $scope.tasks.concat(data);
            $scope.fTasks = applyAllFilters($scope);
        };
    });
});

app.controller('oneTaskCtrl', function ($scope, $routeParams, $http, getObjByID, loggedUser, setLiked, setReceived,
                                        $rootScope, $location, isLoggedIn) {
    if (!isLoggedIn()) $location.path('/main');
    $rootScope.ajaxCall.promise.then(function () {
        $scope.exs = $rootScope.exs;

        $http.get('db/tasks').success(function (tasks) {
            $scope.tasks = tasks;
            $scope.task = getObjByID($routeParams.task_id, tasks);

            var user = loggedUser();
            setLiked($scope.task, user.tasks_liked);
            setReceived($scope.task, user.tasks_received);

            $http.post('db/users', {ids: [$scope.task.author]}).success(function (users) {
                $scope.author = users[0];
            });
        });

        $scope.findSkill = function (id) {
            return $scope.exs.skills[id];
        };

        $scope.findTask = function (id) {
            return getObjByID(id, $scope.tasks);
        };

        $scope.selectedIndex = 0;
        $scope.next = function () {
            $scope.selectedIndex = Math.min($scope.selectedIndex + 1, 2);
        };
        $scope.previous = function () {
            $scope.selectedIndex = Math.max($scope.selectedIndex - 1, 0);
        };
    });
});