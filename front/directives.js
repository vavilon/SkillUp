
app.directive('tasksList', function() {
    return {
        restrict: 'E',
        templateUrl: '/dist/templates/tasks-list.html',
        scope: {
            tasks: '=',
            exs: '=?',
            showDifficulty: '=?',
            showExpand: '=?',
            solvable: '=?',
            approvable: '=?',
            showExp: '=?',
            expStyle: '@?',
            showSkills: '=?',
            send: '=?',
            callback: '=?',
            solution: '=?',
            showLike: '=?',
            showReceive: '=?',
            approve: '=?',
            approveCallback: '=?',
            subheader: '@?',
            receiveCallback: '=?'
        },
        controller: function($http, $scope, $mdToast, loadLoggedUser, loggedUser, getObjByID, $rootScope) {

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

            $scope.apprData = {title_correct: true, skills_correct: true, desc_correct: true, links_correct: true};
            $scope.exs = $scope.exs || $rootScope.exs;
            if ($scope.showDifficulty === undefined) $scope.showDifficulty = true;
            if ($scope.showExpand === undefined) $scope.showExpand = true;
            if ($scope.solvable === undefined) $scope.solvable = true;
            if ($scope.showExp === undefined) $scope.showExp = true;
            if ($scope.showSkills === undefined) $scope.showSkills = true;
            if ($scope.showLike === undefined) $scope.showLike = true;
            if ($scope.showReceive === undefined) $scope.showReceive = true;
            if ($scope.solution === undefined) $scope.solution = {preview: false, text: ''};

            if ($scope.callback === undefined) $scope.callback = function (data, id) {
                if (!data) $scope.showToast('Не удалось отправить решение...');
                else {
                    loadLoggedUser(function() {
                        $scope.showToast('Решение отправлено!', '#toastSuccess');
                        $scope.solution.text = '';
                        var index = 0;
                        for (var i in $scope.tasks) {
                            if ($scope.tasks[i].id === id) {
                                index = i;
                                break;
                            }
                        }
                        $scope.tasks.splice(index, 1);
                    });
                }
            };

            if ($scope.send === undefined) $scope.send = function (id) {
                if ($scope.solution.text.length < 1) {
                    return;
                }
                $http.post('/solve_task', {task_id: $scope.lastExpandedTask.id, content: $scope.solution.text})
                    .success(function(data) { $scope.callback(data, id); });
            };

            if ($scope.approveCallback === undefined) $scope.approveCallback = function (data, id) {
                if (!data) $scope.showToast('Не удалось отправить подтверждение...');
                else {
                    loadLoggedUser(function() {
                        $scope.showToast('Подтверждение отправлено!', '#toastSuccess');
                        var index = 0;
                        for (var i in $scope.tasks) {
                            if ($scope.tasks[i].id === id) {
                                index = i;
                                break;
                            }
                        }
                        $scope.tasks.splice(index, 1);
                    });
                }
            };

            if ($scope.approve === undefined) $scope.approve = function (id) {
                var data = angular.copy($scope.apprData);
                data.task_id = id;
                $http.post('/approve_task', data).success(function(data) { $scope.approveCallback(data, id); });
            };

            $scope.$watchCollection('tasks', function(newVal, oldVal) {
                try {
                    $scope.lastExpandedTask = $scope.tasks[0];
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
        templateUrl: '/dist/templates/solutions-list.html',
        scope: {
            solutions: '=',
            exs: '=?',
            showExpand: '=?',
            showExp: '=?',
            expStyle: '@?',
            showSkills: '=?',
            send: '=?',
            callback: '=?',
            showLike: '=?',
            showCheck: '=?',
            check: '=?',
            subheader: '@?'
        },
        controller: function($http, $scope, $mdToast, loadLoggedUser, loggedUser, getObjByID, $rootScope) {

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

            $scope.exs = $scope.exs || $rootScope.exs;
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
                    loadLoggedUser(function() {
                        $scope.showToast('Решение проверено!', '#toastSuccess');
                        var index = 0;
                        for (var i in $scope.solutions) {
                            if ($scope.solutions[i].id === id) {
                                index = i;
                                break;
                            }
                        }
                        $scope.solutions.splice(index, 1);
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

            $scope.$watch('solutions', function(newVal, oldVal) {
                try {
                    $scope.lastExpandedSolution = $scope.solutions[0];
                    if (!$scope.lastExpandedSolution) return;
                    $scope.lastExpandedSolution.expanded = false;
                } catch (e) {}
            });

            $scope.expand = function (solution) {
                if ($scope.lastExpandedSolution !== solution) $scope.lastExpandedSolution.expanded = false;
                solution.expanded = !solution.expanded;
                $scope.lastExpandedSolution = solution;
            };
        }
    }
});

app.directive('likeButton', function() {
    return {
        restrict: 'E',
        templateUrl: '/dist/templates/like-button.html',
        scope: {
            type: '@',
            id: '=',
            likes: '=',
            liked: '=',
            like: '=?',
            disabled: '=?'
        },
        controller: function($scope, $http, loadLoggedUser) {
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
                    loadLoggedUser();
                });
            };
        }
    };
});

app.directive('receiveButton', function() {
    return {
        restrict: 'E',
        templateUrl: '/dist/templates/receive-button.html',
        scope: {
            type: '@?',
            id: '=',
            count: '=',
            received: '=',
            receive: '=?',
            disabled: '=?',
            callback: '=?'
        },
        controller: function($scope, $http, loadLoggedUser) {
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
                    }
                    else loadLoggedUser();
                    $scope.callback && $scope.callback({id: $scope.id, received: $scope.received});
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
                if (!reached || (element[0].offsetHeight + element[0].scrollTop >= element[0].scrollHeight)) {
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

app.directive('skillButton', function($rootScope, $timeout) {
    return {
        restrict: 'E',
        templateUrl: '/dist/templates/skill-button.html',
        scope: {
            type: '@?',
            id: '=',
            exs: '=?',
            count: '=?',
            withArrows: '=?',
            countVisible: '=?',
            withRemove: '=?',
            onRemove: '=?',
            withAdd: '=?',
            onAdd: '=?',
            hideAdd: '=?',
            hideRemove: '=?',
            tooltipAdd: '@?',
            tooltipRemove: '@?'
        },
        link: function (scope, element, attrs) {
            $timeout(function() {
                scope.exs = scope.exs || $rootScope.exs;
                if (attrs.countVisible === "") scope.countVisible = true;
                if (attrs.withArrows === "") scope.withArrows = true;
                if (attrs.withRemove === "") scope.withRemove = true;
                if (attrs.withAdd === "") scope.withAdd = true;
                if (attrs.hideAdd === "") scope.hideAdd = true;
                if (attrs.hideRemove === "") scope.hideRemove = true;
                var el = element[0].children[0];
                var par = element[0].parentNode;
                    scope.$watch('count', function () {
                        var percent;
                        if (scope.count === undefined || scope.count === null) {
                            percent = 0;
                            el.style.background = 'linear-gradient(to left, rgba(255, 255, 255, 0.5) '
                                + percent + '%, transparent ' + percent + '%)';
                            el.style['background-color'] = '';
                        } else if (angular.isNumber(scope.count)) {
                            percent = Math.floor(100 - scope.count * 100);
                            if (percent > 100) percent = 100;
                            else if (percent < 0) percent = 0;
                            el.style.background = 'linear-gradient(to left, rgba(255, 255, 255, 0.5) '
                                + percent + '%, transparent ' + percent + '%)';
                            el.style['background-color'] = '';
                        }
                    });
                var parWidth = par.offsetWidth;
                if (par.id == 'kostyl') {
                    scope.$watch('mouseOn', function (val) {
                        if (val) {
                            if (scope.withArrows && !scope.countVisible) par.style.width = par.offsetWidth + 40 + 'px';
                            if (scope.withRemove && scope.hideRemove) par.style.width = par.offsetWidth + 20 + 'px';
                            if (scope.withAdd && scope.hideAdd) par.style.width = par.offsetWidth + 20 + 'px';
                        } else par.style.width = parWidth + 'px';
                    });
                }
            }, 0);
        },
        controller: function($scope) {
            $scope.addCount = function () {
                $scope.count += 0.1;
                $scope.count = +$scope.count.toFixed(1);
                if ($scope.count > 1) $scope.count = 1;
            };
            $scope.subCount = function() {
                $scope.count -= 0.1;
                $scope.count = +$scope.count.toFixed(1);
                if ($scope.count < 0.1) $scope.count = 0.1;
            };
        }
    }
});

app.directive("highlightSkill", function ($rootScope, $timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            attributes.$observe('highlightSkill', function (newValue) {
                if (newValue == scope.$parent.skill.id) {
                    var el = document.getElementById(newValue).lastChild.firstChild;
                    console.log({e: el});
                    $timeout(function () {
                        el.scrollIntoView(true);
                        var oldNodeValue = el.attributes[0].nodeValue;
                        el.attributes[0].nodeValue += ' highlighted-skill-animation highlighted-skill';
                        $timeout(function () {
                            el.attributes[0].nodeValue = oldNodeValue + ' highlighted-skill-animation';
                            $timeout(function () {
                                el.attributes[0].nodeValue = oldNodeValue;
                            },700);
                        },700);
                    });
                }
            });
        }
    };
});

app.directive('comments', function($rootScope, $http) {
    return {
        restrict: 'E',
        templateUrl: '/dist/templates/comments.html',
        scope: {
            srcID: '@',
            callback: '=?'
        },
        link: function (scope, element, attrs) {
            scope.loggedUser = $rootScope.loggedUser;
        },
        controller: function($scope) {
            $scope.src = {};

            $scope.el = document.getElementById('comment');

            var oldCommentHeight = $scope.el.offsetHeight;
            $scope.$watch('src.comment', function (newValue) {
                if (newValue && oldCommentHeight && $scope.el.offsetHeight != oldCommentHeight) {
                    $scope.el.parentNode.parentNode.style.height =  $scope.el.offsetHeight + 9 + 'px';
                    oldCommentHeight = $scope.el.offsetHeight;
                }
            });
            $scope.src.addComment = function () {
                //TODO: запрос на добавление коммента
                $scope.callback && $scope.callback($scope.src.comment);
            };
        }
    }
});