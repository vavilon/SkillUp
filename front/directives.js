
app.directive('tasksList', function() {
    return {
        restrict: 'E',
        templateUrl: '/front/templates/tasks-list.html',
        scope: {
            tasksObj: '=',
            skillsObj: '=?',
            showDifficulty: '=?',
            showExpand: '=?',
            solvable: '=?',
            approvable: '=?',
            showExp: '=?',
            expStyle: '@?',
            showSkills: '=?',
            send: '=?',
            callback: '=?',
            solution: '=',
            showLike: '=?',
            showReceive: '=?',
            approve: '=?',
            approveCallback: '=?'
        },
        controller: function($http, $scope, $mdToast, getIsLoggedIn, loggedUser, getObjByID, $rootScope) {

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

            $scope.apprData = {title: true, skills: true, desc: true, links: true};
            $scope.skillsObj = $scope.skillsObj || $rootScope.exs;
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

            if ($scope.send === undefined) $scope.send = function (id) {
                if ($scope.solution.length < 1) {
                    return;
                }
                $http.post('/solve_task', {task_id: $scope.lastExpandedTask.id, content: $scope.solution})
                    .success(function(data) { $scope.callback(data, id); });
            };

            if ($scope.approveCallback === undefined) $scope.approveCallback = function (data, id) {
                if (!data) $scope.showToast('Не удалось отправить подтверждение...');
                else {
                    getIsLoggedIn(function() {
                        $scope.showToast('Подтверждение отправлено!', '#toastSuccess');
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

            if ($scope.approve === undefined) $scope.approve = function (id) {
                $http.post('/approve_task', {task_id: id, data: $scope.apprData})
                    .success(function(data) { $scope.approveCallback(data, id); });
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
        }
    }
});


app.directive('solutionsList', function() {
    return {
        restrict: 'E',
        templateUrl: '/front/templates/solutions-list.html',
        scope: {
            tasksObj: '=',
            skillsObj: '=?',
            usersObj: '=',
            solutionsObj: '=',
            showExpand: '=?',
            showExp: '=?',
            expStyle: '@?',
            showSkills: '=?',
            send: '=?',
            callback: '=?',
            showLike: '=?',
            showCheck: '=?',
            check: '=?'
        },
        controller: function($http, $scope, $mdToast, getIsLoggedIn, loggedUser, getObjByID, $rootScope) {

            $scope.showToast = function (msg, parent, position, delay) {
                parent = parent || '#toastError';
                position = position || 'bottom left';
                delay = delay || 3000;
                $mdToast.show(
                    $mdToast.simple()
                        .content(msg)
                        .position(position)
                        .hideDelay(delay)
                        .parent(angular.element(document.querySelector(parent)))
                );
            };

            $scope.skillsObj = $scope.skillsObj || $rootScope.exs;
            if ($scope.showExpand === undefined) $scope.showExpand = true;
            if ($scope.showExp === undefined) $scope.showExp = true;
            if ($scope.showSkills === undefined) $scope.showSkills = true;
            if ($scope.showLike === undefined) $scope.showLike = true;
            if ($scope.showCheck === undefined) $scope.showCheck = true;

            if ($scope.send === undefined) $scope.send = function (solution) {
                if (solution.isCorrect === undefined) {
                    $scope.showToast('Вы не проверили решение!', null, 'bottom right');
                    return;
                }
                $http.post('/check_solution', {
                    solution_id: solution.id,
                    is_correct: solution.isCorrect,
                    rating: $scope.stars.count
                }).success(function(data) { $scope.callback(data, solution.id); });
            };

            if ($scope.callback === undefined) $scope.callback = function (data, id) {
                if (!data) $scope.showToast('Не удалось отправить результат...');
                else {
                    getIsLoggedIn(function() {
                        $scope.showToast('Решение проверено!', '#toastSuccess');
                        var index = 0;
                        for (var i in $scope.solutionsObj) {
                            if ($scope.solutionsObj[i].id === id) {
                                index = i;
                                break;
                            }
                        }
                        $scope.solutionsObj.splice(index, 1);
                    });
                }
            };

            if ($scope.check === undefined) $scope.check = function (solution, isCorrect) {
                solution.isCorrect = isCorrect;
                $scope.starsFixed = false;
                $scope.stars = {s1: true, s2: true, s3: true, s4: true, s5: true, count: 5};
            };

            $scope.mouseEnterStar = function (num) {
                if ($scope.starsFixed) return;
                for (var i = 1; i <= 5; i++) {
                    $scope.stars['s' + i] = i <= num;
                }
                $scope.stars.count = num;
            };

            $scope.mouseLeaveStar = function (num) {
                if ($scope.starsFixed) return;
                if (!num) {
                    $scope.stars = {s1: false, s2: false, s3: false, s4: false, s5: false};
                    return;
                }
                $scope.stars['s' + num] = false;
                $scope.stars.count = 1;
            };

            $scope.star = function (num) {
                $scope.starsFixed = !($scope.stars.count === num) || !$scope.starsFixed;
                $scope.stars.count = num;
                for (var i = 1; i <= 5; i++) {
                    $scope.stars['s' + i] = i <= num;
                }
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

app.directive('likeButton', function() {
    return {
        restrict: 'E',
        templateUrl: '/front/templates/like-button.html',
        scope: {
            type: '@',
            id: '=',
            likes: '=',
            liked: '=',
            like: '=?'
        },
        controller: function($scope, $http, getIsLoggedIn) {
            if ($scope.like === undefined) $scope.like = function () {
                $scope.liked = !$scope.liked;
                $scope.liked ? $scope.likes++ : $scope.likes--;
                var obj = {};
                obj[$scope.type + '_id'] = $scope.id;
                $http.post('/like_' + $scope.type, obj).success(function(data) {
                    if (!data) {
                        $scope.liked = !$scope.liked;
                        $scope.liked ? $scope.likes++ : $scope.likes--;
                        return;
                    }
                    getIsLoggedIn();
                });
            };
        }
    };
});

app.directive('receiveButton', function() {
    return {
        restrict: 'E',
        templateUrl: '/front/templates/receive-button.html',
        scope: {
            type: '@?',
            id: '=',
            count: '=',
            received: '=',
            receive: '=?'
        },
        controller: function($scope, $http, getIsLoggedIn) {
            if (!angular.isNumber($scope.count) || $scope.count < 0) $scope.count = 0;

            if ($scope.type === undefined) $scope.type = 'task';

            if ($scope.receive === undefined) $scope.receive = function () {
                $scope.received = !$scope.received;
                $scope.received ? $scope.count++ : $scope.count--;
                var obj = {};
                obj[$scope.type + '_id'] = $scope.id;
                $http.post('/receive_' + $scope.type, obj).success(function(data) {
                    if (!data) {
                        $scope.received = !$scope.received;
                        $scope.received ? $scope.count++ : $scope.count--;
                        return;
                    }
                    getIsLoggedIn();
                });
            };
        }
    };
});

app.directive("onScrollBottom", function ($rootScope) {

    function link (scope, element, attrs) {
        var reached = false;
        var options;

        scope.$watch(attrs.onScrollBottom, function(value) {
            if (!value) return;
            options = value;
            options.percent = options.percent || 100;
            options.percent /= 100;
        });

        angular.element(element).bind("scroll", function() {
            if (element[0].offsetHeight + element[0].scrollTop >= element[0].scrollHeight * options.percent) {
                if (!reached) {
                    reached = true;
                    $rootScope.$broadcast(options.event, element);
                }
            } else reached = false;
        });
    }

    return {
        restrict: 'A',
        link: link
    };
});


app.directive('scrollLoader', function() {
    return {
        restrict: 'E',
        scope: {
            events: '=',
            loadFunc: '=',
            offset: '=',
            setLiked: '=?',
            setReceived: '=?',
            callback: '=?'
        },
        controller: function($rootScope, $scope, loggedUser, setLiked, setReceived) {

            var endOfData = false;
            $scope.loadMoreData = function() {
                if (!endOfData) {
                    $scope.loadFunc({offset: $scope.offset}, function(data) {
                        if (data.length) {
                            $scope.offset += data.length;
                            if ($scope.setLiked) setLiked(data, loggedUser().tasks_liked, true);
                            if ($scope.setReceived) setReceived(data, loggedUser().tasks_received, true);
                            if ($scope.callback) $scope.callback(data);
                        }
                        else endOfData = true;
                    });
                }
            };

            if (angular.isArray($scope.events)) {
                for (var i in $scope.events) {
                    $scope.$on($scope.events[i], $scope.loadMoreData);
                }
            }
            else $scope.$on($scope.events, $scope.loadMoreData);
        }
    };
});
