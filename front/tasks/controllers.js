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

app.controller('allTasksCtrl', function ($scope, $http, getObjByID, loggedUser, parseSkills,
                                         $rootScope, $location, isLoggedIn, $mdToast, ScrollLoader) {
    if (!isLoggedIn()) { $location.path('/main'); return; }
    $rootScope.ajaxCall.promise.then(function () {
        $rootScope.pageTitle = 'Задания';
        $rootScope.navtabs = {};//TODO: забиндить какие-нибудь табсы
        $scope.getObjByID = getObjByID;

        //Запилить в расширенный поиск
        //$scope.chips = {};
        //$scope.chips.tasksNames = [];
        //$scope.chips.skillsNames = [];
        //$scope.chips.authorsNames = [];
        //
        //$scope.chips.selectedTasks = [];
        //$scope.chips.selectedSkills = [];
        //$scope.chips.selectedAuthors = [];
        //
        //$scope.chips.selectedTask = null;
        //$scope.chips.selectedSkill = null;
        //$scope.chips.selectedAuthor = null;
        //
        //$scope.chips.searchTextTasks = null;
        //$scope.chips.searchTextSkills = null;
        //$scope.chips.searchTextAuthors = null;
        //
        //$scope.fTasks = [];
        //
        //$scope.getfTasks = function () {
        //    return $scope.fTasks;
        //};
        //
        //$scope.exs = $rootScope.exs;
        //for (var item in $scope.exs.skills) {
        //    $scope.chips.skillsNames.push($scope.exs.skills[item].title);
        //}
        //$scope.chips.skillsQuerySearch = FiltersFactory($scope.chips.skillsNames);
        //
        //$http.get('db/users').success(function (users) {
        //    $scope.users = users;
        //    for (var item in users) {
        //        $scope.chips.authorsNames.push(users[item].name);
        //    }
        //    $scope.chips.authorsQuerySearch = FiltersFactory($scope.chips.authorsNames);
        //});
        //
        //var dbTasksOptions = {filters: {for_solving: true}};
        //$http.post('/db/tasks', dbTasksOptions).success(function (tasks) {
        //    for (var i in tasks) parseSkills(tasks[i]);
        //
        //    $scope.tasks = tasks;
        //    dbTasksOptions.offset = $scope.tasks.length;
        //    $scope.scrollWrap = {loadFunc: loadTasks, callback: $scope.scrollCallback, options: dbTasksOptions};
        //
        //    for (var item in tasks) {
        //        $scope.chips.tasksNames.push(tasks[item].title);
        //    }
        //    $scope.chips.tasksQuerySearch = FiltersFactory($scope.chips.tasksNames);
        //    $scope.fTasks = tasks;
        //});
        //
        //$scope.$watchCollection('chips.selectedTasks', function () {
        //    $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        //});
        //
        //$scope.$watchCollection('chips.selectedSkills', function () {
        //    $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        //});
        //
        //$scope.$watchCollection('chips.selectedAuthors', function () {
        //    $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        //});
        //
        //$scope.scrollCallback = function (newTasks) {
        //    for (var i in newTasks) parseSkills(newTasks[i]);
        //    $scope.tasks = $scope.tasks.concat(newTasks);
        //    $scope.fTasks = applyAllFilters($scope.tasks, $scope.exs.skills, $scope.users, $scope.getObjByID, $scope.chips);
        //};

        $scope.tasks = [];
        $scope.onTasksLoaded = function (data) {
            for (var i in data) {
                parseSkills(data[i]);
            }
            $scope.tasks = $scope.tasks.concat(data);
        };

        $scope.scrollLoader = ScrollLoader($scope, {
            events: 'indexPageScrolled',
            method: 'post',
            url: 'db/tasks',
            body: {sort: {columnName: 'date_created', direction: 'desc'}},
            onLoadEnd: $scope.onTasksLoaded
        });

        $scope.scrollLoader.loadMoreData();

        $scope.taskReceived = function (data) {
            var title = getObjByID(data.id, $scope.tasks).title;
            var text = data.received
                ? 'Задание "' + title + '" взято. Оно появится на главной странице.'
                : 'Задание "' + title + '" удалено из избранных.';
            $mdToast.show(
                $mdToast.simple()
                    .textContent(text)
                    .hideDelay(2000)
            );
        };

        //Функция сортировки, при нажатии на название колонки
        $scope.sortColumn = function (columnName) {
            //Сортировка списка в зависимости от значения переменной $scope.column[columnName]: (asc, desc)
            if (!$scope.columnSort[columnName] || $scope.columnSort[columnName] == 'desc') {
                $scope.columnSort = {};
                $scope.columnSort[columnName] = 'asc';
                $scope.scrollLoader = ScrollLoader($scope, {
                    events: 'indexPageScrolled',
                    method: 'post',
                    url: 'db/tasks',
                    body: {sort: {columnName: columnName, direction: 'asc'}},
                    onLoadEnd: $scope.onTasksLoaded
                });
            } else if ($scope.columnSort[columnName] == 'asc') {
                $scope.columnSort[columnName] = 'desc';
                $scope.scrollLoader = ScrollLoader($scope, {
                    events: 'indexPageScrolled',
                    method: 'post',
                    url: 'db/tasks',
                    body: {sort: {columnName: columnName, direction: 'desc'}},
                    onLoadEnd: $scope.onTasksLoaded
                });
            }
        };
    });
});

app.controller('oneTaskCtrl', function ($scope, $routeParams, $http, getObjByID, loggedUser, parseSkills,
                                        $rootScope, $location, isLoggedIn, getEndingVariant, $mdToast) {
    if (!isLoggedIn()) { $location.path('/main'); return; }
    $rootScope.sidenavVisible = false;

    $scope.getEndingVariant = getEndingVariant;
    $scope.solvedTextVariants = ['решил', 'решили', 'решило'];
    $scope.solvingTextVariants = ['решает', 'решают', 'решают'];

    $rootScope.ajaxCall.promise.then(function () {
        $scope.exs = $rootScope.exs;
        $rootScope.navtabs = {};//TODO: забиндить какие-нибудь табсы
        $scope.currentTask = {};
        $scope.solution = {};
        $scope.solution.preview = false;

        $http.post('/db/tasks', {id: $routeParams.task_id, solutionsCount: true}).success(function (rows) {
            $scope.currentTask = rows[0];
            parseSkills($scope.currentTask);

            $http.post('/db/users', {id: $scope.currentTask.author}).success(function (rows) {
                $scope.author = rows[0];
            });
        });

        $scope.solution.showPreview = function () {
            $scope.solution.preview = !$scope.solution.preview;
        };

        $scope.solution.sendSolution = function (taskID, text) {
            if (!text || !text.length) {
                return;
            }

            $http.post('/solve_task', {id: taskID, content: text}).success(function (data) {
                if (data == 'ok')
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Решение успешно отправлено')
                            .hideDelay(2000)
                    );
                //TODO: Где пользователь сможет посмотреть, как продвигается проверка его решения?
                else
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('При отправке решения произошла ошибка')
                            .hideDelay(2000)
                    );
            })
        };
    });
});