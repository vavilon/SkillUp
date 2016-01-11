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

// Находит пересечение двух массивов и возвращает новый массив с пересекающимися елементами
function intersectionOfArrays(array1, array2) {
    var temp = [];
    for (var obj in array1) {
        var element1 = array1[obj];
        if(array2.findIndex(function(element2, index, array) {
                return element2.id === element1.id;
            }) !== -1) temp.push(element1);
    }
    return temp;
}

// Фильтрует массив заданий (tasks) по названиям, скилам и авторам, котрые передаются в объекте "chips"
function applyAllFilters(tasks, skills, users, getObjByID, chips) {
    var filteredTasks = tasks;
    var filteredByTitle = [];
    var filteredBySkills = [];
    var filteredByAuthors = [];

    if(chips.selectedTasks.length) {
        for(var titleID in chips.selectedTasks) {
            var title = chips.selectedTasks[titleID];
            for(var taskID in tasks) {
                var task = tasks[taskID];
                if(task.title === title) filteredByTitle.push(task);
            }
        }
        filteredTasks = filteredByTitle.slice();
    }

    if(chips.selectedSkills.length) {
        for (var titleID in chips.selectedSkills) {
            var title = chips.selectedSkills[titleID];
            for (var taskID in tasks) {
                var task = tasks[taskID];
                for (var i in task.skills) {
                    var skillID = task.skills[i].skill_id;
                    if (skills[skillID].title === title) {
                        filteredBySkills.push(task);
                        break;
                    }
                }
            }
        }

        filteredTasks = intersectionOfArrays(filteredBySkills, filteredTasks);
    }

    if(chips.selectedAuthors.length) {
        for(var nameID in chips.selectedAuthors) {
            var name = chips.selectedAuthors[nameID];
            for(var taskID in tasks) {
                var task = tasks[taskID];
                if(getObjByID(task.author, users).name === name) filteredByAuthors.push(task);
            }
        }


        filteredTasks = intersectionOfArrays(filteredByAuthors, filteredTasks);
    }

    return filteredTasks;
}

app.controller('allTasksCtrl', function ($scope, $http, getObjByID, loggedUser, parseSkills, loadTasks,
                                         $rootScope, $location, isLoggedIn) {
    if (!isLoggedIn()) { $location.path('/main'); return; }
    $rootScope.ajaxCall.promise.then(function () {
        $rootScope.pageTitle = 'Задания';
        $rootScope.navtabs = {};//TODO: забиндить какие-нибудь табсы
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
            for (var i in tasks) parseSkills(tasks[i]);

            $scope.tasks = tasks;
            dbTasksOptions.offset = $scope.tasks.length;
            $scope.scrollWrap = {loadFunc: loadTasks, callback: $scope.scrollCallback, options: dbTasksOptions};

            for (var item in tasks) {
                $scope.chips.tasksNames.push(tasks[item].title);
            }
            $scope.chips.tasksQuerySearch = FiltersFactory($scope.chips.tasksNames);
            $scope.fTasks = tasks;
        });

        $scope.$watchCollection('chips.selectedTasks', function () {
            $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        });

        $scope.$watchCollection('chips.selectedSkills', function () {
            $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        });

        $scope.$watchCollection('chips.selectedAuthors', function () {
            $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        });

        $scope.scrollCallback = function (newTasks) {
            for (var i in newTasks) parseSkills(newTasks[i]);
            $scope.tasks = $scope.tasks.concat(newTasks);
            $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        };
    });
});

app.controller('oneTaskCtrl', function ($scope, $routeParams, $http, getObjByID, loggedUser, parseSkills,
                                        $rootScope, $location, isLoggedIn) {
    if (!isLoggedIn()) { $location.path('/main'); return; }
    $rootScope.ajaxCall.promise.then(function () {
        $scope.exs = $rootScope.exs;
        $rootScope.navtabs = {};//TODO: забиндить какие-нибудь табсы
        $http.post('db/tasks', {id: $routeParams.task_id}).success(function (task) {
            task = task[0];
            $rootScope.pageTitle = task.title;
            parseSkills(task);
            $scope.task = task;

            $http.post('db/users', {id: $scope.task.author}).success(function (user) {
                user = user[0];
                parseSkills(user, true);
                $scope.author = user;
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