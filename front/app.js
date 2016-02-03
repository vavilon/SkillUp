var app = angular.module('skills', [
    'ngRoute',
    'ngMaterial',
    'ngAnimate',
    'hljs',
    'ngCookies',
    'ngMessages',
    'ngImgCrop',
    'hc.marked'
]);

app.config(function ($locationProvider, $routeProvider, $mdThemingProvider, hljsServiceProvider, $httpProvider, markedProvider) {
    $locationProvider.html5Mode(true);

    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.withCredentials = true;
    delete $httpProvider.defaults.headers.common["X-Requested-With"];
    $httpProvider.defaults.headers.common["Accept"] = "application/json";
    $httpProvider.defaults.headers.common["Content-Type"] = "application/json";

    $routeProvider
        .when('/admin', {templateUrl: '/dist/users/admin.html', controller: 'adminCtrl'})
        .when('/main', {templateUrl: '/dist/main.html', controller: 'mainPageCtrl'})
        .when('/users', {templateUrl: '/dist/users/all.html', controller: 'usersListCtrl'})
        .when('/tasks', {templateUrl: '/dist/tasks/all.html', controller: 'allTasksCtrl'})
        .when('/tasks/:task_id', {templateUrl: '/dist/tasks/one.html', controller: 'oneTaskCtrl'})
        .when('/tasks/:task_id/decision', {templateUrl: '/dist/tasks/decision.html'})
        .when('/tasks/:task_id/approve', {templateUrl: '/dist/tasks/approve.html'})
        .when('/tasks/:task_id/check', {templateUrl: '/dist/tasks/check.html'})
        .when('/tasks/:task_id/create', {templateUrl: '/dist/tasks/create.html'})
        .when('/skills', {templateUrl: '/dist/skills/skills.html', controller: 'skillsCtrl'})
        .when('/users/:user_id', {templateUrl: '/dist/users/one.html', controller: 'profileCtrl'})
        .when('/competences', {templateUrl: '/dist/competences/competences.html', controller: 'competencesCtrl'})
        .when('/registration', {templateUrl: '/dist/users/registration.html', controller: 'registrationCtrl'})
        .when('/registration/step2', {templateUrl: '/dist/users/registration.html', controller: 'registrationCtrl'})
        .when('/registration/nick/:nick/email/:email/password/:password*',
        {templateUrl: '/dist/users/registration.html', controller: 'registrationCtrl'})
        .when('/restore', {templateUrl: '/dist/users/restore.html', controller: 'restoreCtrl'})
        .otherwise({redirectTo: '/main'});

    /*    $mdThemingProvider.theme('default')
     .primaryPalette('indigo', {
     'default': '500',
     'hue-1': '300',
     'hue-2': '800',
     'hue-3': 'A100'
     })
     .accentPalette('pink', {
     'default': '400',
     'hue-1': '300',
     'hue-2': '800',
     'hue-3': 'A100'
     })
     .warnPalette('red', {
     'default': '500',
     'hue-1': '300',
     'hue-2': '800',
     'hue-3': 'A100'
     });*/

    hljsServiceProvider.setOptions({
        tabReplace: '    '
    });

    markedProvider.setOptions({
        gfm: true,
        tables: true,
        highlight: function (code, lang) {
            if (lang) {
                return hljs.highlight(lang, code, true).value;
            } else {
                return hljs.highlightAuto(code).value;
            }
        }
    });
});

app.run(function ($rootScope, $http, loadLoggedUser, $q, isLoggedIn, $location, updateExs) {
    $rootScope.ajaxCall = $q.defer();
    $rootScope.isLoggedIn = isLoggedIn;
    $rootScope.sidenavVisible = true;
    $rootScope.navtabs = {selected: 0, tabs: []};

    if ($location.path().indexOf('registration') > -1) $rootScope.ajaxCall.resolve();
    else loadLoggedUser(function(user) {
        if (user) {
            $http.get('db/skills').success(function (data) {
                if (data) {
                    updateExs(data);
                }
                $rootScope.ajaxCall.resolve();
            });
        } else $rootScope.ajaxCall.resolve();
    });

    function setPageNum(obj, newVal, oldVal) {
        if ((new RegExp('/main')).test(newVal)) $rootScope.selectedPageNum = 0;
        else if ((new RegExp('/skills')).test(newVal)) $rootScope.selectedPageNum = 1;
        else if ((new RegExp('/tasks')).test(newVal)) $rootScope.selectedPageNum = 2;
        else if ((new RegExp('/users')).test(newVal)) {
            if (newVal.split('/').pop() == $rootScope.loggedUser.id) $rootScope.selectedPageNum = 4;
            else $rootScope.selectedPageNum = 3;
        }
        else if ((new RegExp('/competences')).test(newVal)) $rootScope.selectedPageNum = 5;
        else if ((new RegExp('/admin')).test(newVal)) $rootScope.selectedPageNum = -1;
    }

    $rootScope.ajaxCall.promise.then(function () {
        setPageNum(null, $location.path());
        $rootScope.$on('$locationChangeSuccess', setPageNum);
    });
});

app.controller('navbarCtrl', function ($scope, $http, $routeParams, $location, $rootScope, $timeout, extendedSkills,
                                       loadLoggedUser, $mdDialog, $mdToast, loggedUser, appendProgressToExs, bindToNavtabs) {

    //!!! ОСТОРОЖНО !!!
    //ДАЛЬНЕЙШИЙ КОД МОЖЕТ НАНЕСТИ ВАШЕЙ ПСИХИКЕ НЕПОПРАВИМЫЙ УЩЕРБ
    function setTabsMargin(){
        var el = document.getElementById('navtabs');
        if (el && el.children[0] && el.children[0].children[1] && el.children[0].children[1].children[0]){
            var navtabs = el.children[0].children[1].children[0];
            if (navtabs.offsetWidth > window.innerWidth || navtabs.offsetWidth < 30) $timeout(setTabsMargin, 10);
            else {
                navtabs.style.marginLeft = 'calc((100vw - ' + navtabs.offsetWidth + 'px) / 2)';
                document.getElementById('navtabs').style.opacity = 1;
            }
        }
    }
    $timeout(setTabsMargin, 10);
    $scope.navtabs = {selected: 0, tabs: []};
    $rootScope.$watch('navtabs', function (newValue, oldValue) {
        var el = document.getElementById('navtabs');
        el.style.opacity = 0;
        $timeout(function() {
            $scope.navtabs = newValue;
            el.style.opacity = 1;
            $timeout(setTabsMargin, 10);
        }, 200);
    });
    bindToNavtabs($scope, 'navtabs');
    //СДЕСЬ МОЖЕТЕ СНОВА ОТКРЫТЬ ГЛАЗА

    $scope.date = new Date();

    $scope.loginErr = {loginerr: false};

    $scope.toggleSidenav = function() {
        $rootScope.sidenavVisible = !$rootScope.sidenavVisible;
    };

    $scope.getSelectedPageNum = function () {
        return $rootScope.selectedPageNum;
    };

    $scope.loggedUser = loggedUser;

    $rootScope.$watch('loginData', function (newVal) {
        if (newVal) $scope.login(newVal.email, newVal.password);
    });

    $scope.login = function (email, password) {
        $http.post('/login', {email: email, password: password})
            .success(function (data) {
                if (!data) {
                    $rootScope.loginErr = {loginerr: true};
                    $timeout(function () {
                        $rootScope.loginErr = {loginerr: false};
                    }, 3000);
                    return;
                }
                loadLoggedUser(function (user) {
                    if (user) {
                        $http.get('db/skills').success(function (skills) {
                            if (skills) {
                                $rootScope.exs = new extendedSkills(skills);
                                appendProgressToExs();
                                $rootScope.ajaxCall.resolve();
                                $mdDialog.hide();
                                $location.path('/main'); //фикс, если логинишься со своей страницы, а не с главной
                                $timeout(function () {
                                    $location.path(data);
                                }, 1);
                            }
                        });
                    }
                });
            });
    };

    $scope.showLoginDialog = function (ev) {
        $mdDialog.show({
            controller: LoginDialogController,
            templateUrl: '/dist/users/login.html',
            targetEvent: ev
        });
    };

    $scope.logout = function () {
        $http.get('/logout').success(function (data) {
            loadLoggedUser(function () {
                $location.path('/main');
            });
        });
    };

    function LoginDialogController($scope, $mdDialog, $rootScope) {
        $scope.log = {};

        $scope.hide = function () {
            $scope.log.email = 'loh';
            $scope.log.password = 'loh';
            $mdDialog.hide();
        };
        $scope.cancel = function () {
            $scope.log.email = 'loh';
            $scope.log.password = 'loh';
            $mdDialog.hide();
        };
        $scope.answer = function () {
            if (!$scope.log.email || !$scope.log.password) return;
            $rootScope.loginData = {email: $scope.log.email, password: $scope.log.password};
        };

        $scope.getLoginErr = function () {
            return $rootScope.loginErr;
        };
    }
});

app.controller('mainPageCtrl', function ($scope, $http, isLoggedIn, $location, $timeout, parseSkills, loggedUser,
                                         $mdToast, $rootScope, loadLoggedUser, getObjByID, completedSkills,
                                         skillsToIDs, $mdSidenav, bindToNavtabs, $mdDialog) {
    $rootScope.pageTitle = 'Главная';
    $scope.registrationPath = "/registration/";
    $scope.reg = {email: '', password: ''};

    $scope.register = function () {
        $scope.registrationPath += 'nick/' + ($scope.reg.nick || '0');
        $scope.registrationPath += '/email/' + ($scope.reg.email || '0');
        $scope.registrationPath += '/password/' + ($scope.reg.password || '0');
        $location.path($scope.registrationPath);
    };

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

    //Следующий блок кода нужен для того, чтобы избежать бага с плейсхолдером пароля
    var count = 0;
    $scope.$watchCollection('reg', function (newVal, oldVal) {
        if (count < 2) {
            $scope.reg.email = '';
            $scope.reg.password = '';
            count++;
        }
    });

    $rootScope.ajaxCall.promise.then(function () {
        if (!isLoggedIn()) return;
        $scope.exs = $rootScope.exs;

        $scope.navtabs = {selected: 0, tabs: ['Решить', 'Проверить', 'Подтвердить']};
        bindToNavtabs($scope, 'navtabs');

        $scope.next = function () {
            if ($scope.navtabs.selected < 2) {
                $scope.navtabs.selected++;
            }
        };
        $scope.previous = function () {
            if ($scope.navtabs.selected > 0) {
                $scope.navtabs.selected--;
            }
        };

        $scope.calculateDifficulty = function (tasks, user) {
            var count = 0;
            for (var i in tasks) {
                count = 0;
                for (var j in tasks[i].skills) {
                    for (var k in user.skills) {
                        if (tasks[i].skills[j].skill_id === user.skills[k].skill_id) {
                            count += user.skills[k].count < 1 ? user.skills[k].count : 1;
                            break;
                        }
                    }
                }
                tasks[i].difficulty = count / tasks[i].skills.length;
            }
        };

        $scope.receiveCallback = function (data) {
            var arr = data.received ? $scope.tasksRecommended : $scope.tasksReceived;
            var arrOther = data.received ? $scope.tasksReceived : $scope.tasksRecommended;
            var index = 0;
            for (var i in arr) {
                if (arr[i].id === data.id) {
                    index = i;
                    break;
                }
            }
            var el = arr.splice(index, 1)[0];
            el.expanded = false;
            if (arrOther === $scope.tasksRecommended) {
                for (var i in $scope.user.skills) {
                    for (var j in el.skills) {
                        if ($scope.user.skills[i].skill_id === el.skills[j]) {
                            arrOther.push(el);
                            return;
                        }
                    }
                }
            }
            else arrOther.push(el);
        };

        $scope.user = loggedUser();
        $scope.user.completedSkills = completedSkills($scope.user.skills);

        $scope.tasksReceived = [];
        $scope.tasksRecommended = [];
        $scope.solutionsForChecking = [];
        $scope.tasksForApproving = [];

        $scope.loaded = {};
        $scope.isProgressVisible = function() {
            return ($scope.navtabs.selected === 0 && (!$scope.loaded.received || !$scope.loaded.recommended))
                || ($scope.navtabs.selected === 1 && !$scope.loaded.check) || ($scope.navtabs.selected === 2 && !$scope.loaded.approve);
        };

        $http.post('/db/tasks', {filters: {for_solving: true, received: true}}).success(function (data) {
            for (var i in data) parseSkills(data[i]);
            $scope.tasksReceived = data;
            $scope.calculateDifficulty(data, $scope.user);
            for (var i in $scope.tasksReceived) $scope.tasksReceived[i].received = true;
            $scope.loaded.received = true;
        });

        $http.post('/db/tasks', {
            filters: {for_solving: true, received: false},
            skills: skillsToIDs($scope.user.skills)
        }).success(function (data) {
            for (var i in data) parseSkills(data[i]);
            $scope.tasksRecommended = data;
            $scope.calculateDifficulty(data, $scope.user);
            $scope.loaded.recommended = true;
        });

        $http.post('/db/solutions', {
            filters: {for_checking: true},
            skills: skillsToIDs($scope.user.completedSkills)
        }).success(function (data) {
            for (var i in data) parseSkills(data[i]);
            $scope.solutionsForChecking = data;
            $scope.loaded.check = true;
        });

        $http.post('/db/tasks', {
            filters: {for_approving: true},
            skills: skillsToIDs($scope.user.completedSkills)
        }).success(function (data) {
            for (var i in data) parseSkills(data[i]);
            $scope.tasksForApproving = data;
            $scope.loaded.approve = true;
        });

        $scope.showCreateTaskDialog = function(ev) {
            $mdDialog.show({
                controller: createTaskDialogController,
                templateUrl: '/dist/templates/createTaskDialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false
            });
        };

        function getParentScope () { return $scope; }
        function createTaskDialogController($scope, $rootScope, $http, $mdDialog, $mdSidenav, loadLoggedUser) {
            var $parentScope = getParentScope();
            $scope.user = $parentScope.user;

            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.answer = function (answer) {
                $mdDialog.hide(answer);
            };

            $scope.sendTask = {title: '', description: '', links: [], link: '', skills: []};

            $scope.addLink = function () {
                if (!$scope.sendTask.link) {
                    $parentScope.showToast('Введите ссылку!');
                    return;
                }
                if (_.includes($scope.sendTask.links, $scope.sendTask.link)) {
                    $parentScope.showToast('Такая ссылка уже добавлена!');
                    return;
                }
                $scope.sendTask.links.push($scope.sendTask.link);
                $scope.sendTask.link = '';
            };

            $scope.removeLink = function (index) {
                $scope.sendTask.links.splice(index, 1);
            };

            $scope.addSkill = function (skill) {
                var s = {skill_id: skill.skill_id, count: 0.5};
                $scope.sendTask.skills.push(s);
                $scope.user.completedSkills.splice($scope.user.completedSkills.indexOf(skill), 1);
            };

            $scope.removeSkill = function (skill_id, count) {
                for (var i in $scope.sendTask.skills)
                    if ($scope.sendTask.skills[i].skill_id == skill_id) {
                        $scope.sendTask.skills.splice(i, 1);
                        break;
                    }
                $scope.user.completedSkills.push({skill_id: skill_id, title: $rootScope.exs.skills[skill_id].title});
            };

            $scope.showSidenavSkills = function () {
                $mdSidenav('right').toggle().then(function () {});
            };

            $scope.taskCreated = true;
            $scope.createTask = function () {
                $scope.taskCreated = false;
                if ($scope.sendTask.title.length < 10) {
                    $scope.taskCreated = true;
                    return;
                }
                if ($scope.sendTask.description.length < 30) {
                    $scope.taskCreated = true;
                    return;
                }
                if (!$scope.sendTask.skills.length) {
                    $scope.taskCreated = true;
                    $parentScope.showToast('Прикрепите умения к заданию!');
                    return;
                }
                if (!$scope.sendTask.links.length) {
                    $scope.taskCreated = true;
                    $parentScope.showToast('Добавьте ссылки на учебные материалы!');
                    return;
                }
                $http.post('/create_task', $scope.sendTask).success(function (data) {
                    $scope.taskCreated = true;
                    if (!data) {
                        $parentScope.showToast('Ошибка при создании задания! Попробуйте еще раз...');
                        return;
                    }

                    loadLoggedUser();
                    $mdDialog.cancel();
                    $parentScope.showToast('Задание успешно создано!', '#toastSuccess');
                });
            };
        }
    });
});