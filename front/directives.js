
app.directive('tasksList', function(getObjByID) {
    return {
        restrict: 'E',
        templateUrl: '/front/templates/taskslist.html',
        scope: {
            tasksObj: '=',
            skillsObj: '=',
            usersObj: '=',
            showDifficulty: '=?',
            showExpand: '=?',
            solvable: '=?',
            showExp: '=?',
            showSkills: '=?',
            send: '=?',
            callback: '=?',
            solution: '=',
            like: '=?',
            receive: '=?',
            showLike: '=?',
            showReceive: '=?'
        },
        controller: function($http, $scope, $mdToast, getIsLoggedIn, loggedUser) {

            $scope.showToast = function (msg, parent) {
                parent = parent || '#toastError';
                $mdToast.show(
                    $mdToast.simple()
                        .content(msg)
                        .position('bottom left')
                        .hideDelay(3000)
                        .parent(angular.element(document.querySelector(parent)))
                );
            };

            if ($scope.showDifficulty === undefined) $scope.showDifficulty = true;
            if ($scope.showExpand === undefined) $scope.showExpand = true;
            if ($scope.solvable === undefined) $scope.solvable = true;
            if ($scope.showExp === undefined) $scope.showExp = true;
            if ($scope.showSkills === undefined) $scope.showSkills = true;
            if ($scope.showLike === undefined) $scope.showLike = true;
            if ($scope.showReceive === undefined) $scope.showReceive = true;
            if ($scope.callback === undefined) $scope.callback = function (data, id) {
                if (!data) $scope.showToast('Не удалось отправить решение...');
                else {
                    getIsLoggedIn(function() {
                        $scope.showToast('Решение отправлено!', '#toastSuccess');
                        $scope.solution = '';
                        var index = 0;
                        for (var i in $scope.tasksObj) {
                            if ($scope.tasksObj[i].id === id) {
                                index = i;
                                break;
                            }
                        }
                        $scope.tasksObj.splice(index, 1);
                    });
                }
            };
            if ($scope.send === undefined) $scope.send = function (callback, id) {
                if ($scope.solution.length < 30) {
                    return;
                }
                $http.post('/solve_task', {task_id: $scope.lastExpandedTask.id, content: $scope.solution})
                    .success(function(data) { callback(data, id); });
            };
            if ($scope.like === undefined) $scope.like = function (task) {
                task.liked = !task.liked;
                task.liked ? task.likes++ : task.likes--;
                $http.post('/like_task', {task_id: task.id}).success(function(data) {
                    if (!data) {
                        task.liked = !task.liked;
                        task.liked ? task.likes++ : task.likes--;
                        return;
                    }
                    getIsLoggedIn();
                });
            };
            if ($scope.receive === undefined) $scope.receive = function (task) {
                task.received = !task.received;
                task.received ? task.participants.push(loggedUser().id) :
                    task.participants.splice(task.participants.indexOf(loggedUser().id), 1);
                $http.post('/receive_task', {task_id: task.id}).success(function(data) {
                    if (!data) {
                        task.received = !task.received;
                        task.received ? task.participants.push(loggedUser().id) :
                            task.participants.splice(task.participants.indexOf(loggedUser().id), 1);
                    }
                    getIsLoggedIn();
                });
            };
            $scope.$watch('tasksObj', function(newVal, oldVal) {
                try {
                    $scope.lastExpandedTask = $scope.tasksObj[0];
                    if (!$scope.lastExpandedTask) return;
                    $scope.lastExpandedTask.expanded = false;
                } catch (e) {}
            });

            $scope.expand = function (task) {
                if ($scope.lastExpandedTask !== task) $scope.lastExpandedTask.expanded = false;
                task.expanded = !task.expanded;
                $scope.lastExpandedTask = task;
            };

            $scope.findUser = function (id) {
                return getObjByID(id, $scope.usersObj);
            };
            $scope.findSkill = function (id) {
                return getObjByID(id, $scope.skillsObj);
            };
            $scope.findTask = function (id) {
                return getObjByID(id, $scope.tasksObj);
            };
        }
    }
});


app.directive('solutionsList', function(getObjByID) {
    return {
        restrict: 'E',
        templateUrl: '/front/templates/solutionslist.html',
        scope: {
            tasksObj: '=',
            skillsObj: '=',
            usersObj: '=',
            solutionsObj: '=',
            showExpand: '=?',
            showExp: '=?',
            showSkills: '=?',
            send: '=?',
            callback: '=?',
            like: '=?',
            showLike: '=?',
            showCheck: '=?',
            check: '=?'
        },
        controller: function($http, $scope, $mdToast, getIsLoggedIn, loggedUser) {

            $scope.showToast = function (msg, parent) {
                parent = parent || '#toastError';
                $mdToast.show(
                    $mdToast.simple()
                        .content(msg)
                        .position('bottom left')
                        .hideDelay(3000)
                        .parent(angular.element(document.querySelector(parent)))
                );
            };

            if ($scope.showExpand === undefined) $scope.showExpand = true;
            if ($scope.showExp === undefined) $scope.showExp = true;
            if ($scope.showSkills === undefined) $scope.showSkills = true;
            if ($scope.showLike === undefined) $scope.showLike = true;
            if ($scope.showCheck === undefined) $scope.showCheck = true;
            if ($scope.callback === undefined) $scope.callback = function (data, id) {
                if (!data) $scope.showToast('Не удалось отправить решение...');
                else {
                    getIsLoggedIn(function() {
                        $scope.showToast('Решение отправлено!', '#toastSuccess');
                        $scope.solution = '';
                        var index = 0;
                        for (var i in $scope.tasksObj) {
                            if ($scope.tasksObj[i].id === id) {
                                index = i;
                                break;
                            }
                        }
                        $scope.tasksObj.splice(index, 1);
                    });
                }
            };

            if ($scope.check === undefined) $scope.check = function (solution, isCorrect) {
                if (isCorrect) {
                    solution.checkedCorrect = true;
                    solution.checkedIncorrect = false;
                }
                else {
                    solution.checkedCorrect = false;
                    solution.checkedIncorrect = true;
                }
            };

            if ($scope.send === undefined) $scope.send = function (callback, id) {
                if ($scope.solution.length < 30) {
                    return;
                }
                $http.post('/solve_task', {task_id: $scope.lastExpandedTask.id, content: $scope.solution})
                    .success(function(data) { callback(data, id); });
            };
            if ($scope.like === undefined) $scope.like = function (solution) {
                solution.liked = !solution.liked;
                solution.liked ? solution.likes++ : solution.likes--;
                $http.post('/like_solution', {solution_id: solution.id}).success(function(data) {
                    if (!data) {
                        solution.liked = !solution.liked;
                        solution.liked ? solution.likes++ : solution.likes--;
                        return;
                    }
                    getIsLoggedIn();
                });
            };
            $scope.$watch('solutionsObj', function(newVal, oldVal) {
                try {
                    $scope.lastExpandedSolution = $scope.solutionsObj[0];
                    if (!$scope.lastExpandedSolution) return;
                    $scope.lastExpandedSolution.expanded = false;
                } catch (e) {}
            });

            $scope.expand = function (solution) {
                if ($scope.lastExpandedSolution !== solution) $scope.lastExpandedSolution.expanded = false;
                solution.expanded = !solution.expanded;
                $scope.lastExpandedSolution = solution;
            };

            $scope.findUser = function (id) {
                return getObjByID(id, $scope.usersObj);
            };
            $scope.findSkill = function (id) {
                return getObjByID(id, $scope.skillsObj);
            };
            $scope.findTask = function (id) {
                return getObjByID(id, $scope.tasksObj);
            };
            $scope.findSolution = function (id) {
                return getObjByID(id, $scope.solutionsObj);
            };
            //console.log($scope.findTask($scope.solutionsObj[0].task_id).title);
        }
    }
});

