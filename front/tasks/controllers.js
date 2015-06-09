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

app.controller('allTasksCtrl', function ($scope, $http, getObjByID) {
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

    $scope.getfTasks = function() { return $scope.fTasks;};

    $http.get('db/skills').success(function (skills) {
        $scope.skills = skills;
        for(var item in skills) {
            $scope.chips.skillsNames.push(skills[item].title);
        }
        $scope.chips.skillsQuerySearch = FiltersFactory($scope.chips.skillsNames);
    });

    $http.get('db/users').success(function (users) {
        $scope.users = users;
        for(var item in users) {
            $scope.chips.authorsNames.push(users[item].name);
        }
        $scope.chips.authorsQuerySearch = FiltersFactory($scope.chips.authorsNames);

        $http.get('db/tasks').success(function (tasks) {
            $scope.tasks = tasks;
            for(var item in tasks) {
                $scope.chips.tasksNames.push(tasks[item].title);
            }
            $scope.chips.tasksQuerySearch = FiltersFactory($scope.chips.tasksNames);
            $scope.fTasks = $scope.tasks;
        });
    });

    $scope.$watchCollection('chips.selectedTasks', function(newVal) {
        if(newVal.length === 0) $scope.fTasks = [].concat($scope.tasks);
        else {
            $scope.fTasks = [];
            for(var idN in newVal) {
                var title = newVal[idN];
                for(var idT in $scope.tasks) {
                    var task = $scope.tasks[idT];
                    if(task.title === title) $scope.fTasks.push(task);
                }
            }
        }
    });

    $scope.$watchCollection('chips.selectedSkills', function(newVal) {
        if(newVal.length === 0) $scope.fTasks = [].concat($scope.tasks);
        else {
            $scope.fTasks = [];
            for (var idN in newVal) {
                var title = newVal[idN];
                for (var idT in $scope.tasks) {
                    var task = $scope.tasks[idT];
                    for (var idS in task.skills) {
                        var skillID = task.skills[idS];
                        if (getObjByID(skillID, $scope.skills).title === title) {
                            $scope.fTasks.push(task);
                            break;
                        }
                    }
                }
            }
        }
    });

    $scope.$watchCollection('chips.selectedAuthors', function(newVal) {
        if(newVal.length === 0) $scope.fTasks = [].concat($scope.tasks);
        else {
            $scope.fTasks = [];
            for(var idN in newVal) {
                var name = newVal[idN];
                for(var idT in $scope.tasks) {
                    var task = $scope.tasks[idT];
                    if(getObjByID(task.author, $scope.users).name === name) $scope.fTasks.push(task);
                }
            }
        }
    });
});

app.controller('oneTaskCtrl', function ($scope, $routeParams, $http, getObjByID) {
        $http.get('db/skills').success(function (skills) {
            $scope.skills = skills;

        });

        $http.get('db/tasks').success(function (tasks) {
            $scope.tasks = tasks;
            $scope.task = getObjByID($routeParams.task_id, tasks);
            $http.get('db/users').success(function (users) {
                $scope.users = users;
                for (var user in users)
                    if (users[user].id === $scope.task.author) $scope.author = users[user];
            });
        });

        $scope.findSkill = function (id) {
            return getObjByID(id, $scope.skills);
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
    }
);