var app = angular.module('skills', [
    'ngRoute',
    'ngMaterial',
    'ngAnimate',
    'hljs',
    'ngCookies',
    'ngMessages',
    'ngImgCrop'
]);

app.config(function ($locationProvider, $routeProvider, $mdThemingProvider, hljsServiceProvider, $httpProvider) {
    $locationProvider.html5Mode(true);

    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.withCredentials = true;
    delete $httpProvider.defaults.headers.common["X-Requested-With"];
    $httpProvider.defaults.headers.common["Accept"] = "application/json";
    $httpProvider.defaults.headers.common["Content-Type"] = "application/json";

    $routeProvider
        .when('/admin', {templateUrl: '/front/users/admin.html', controller: 'adminCtrl'})
        .when('/main', {templateUrl: '/front/main.html', controller: 'mainPageCtrl'})
        .when('/users', {templateUrl: '/front/users/all.html', controller: 'usersListCtrl'})
        .when('/tasks', {templateUrl: '/front/tasks/all.html', controller: 'allTasksCtrl'})
        .when('/tasks/:task_id', {templateUrl: '/front/tasks/one.html', controller: 'oneTaskCtrl'})
        .when('/tasks/:task_id/decision', {templateUrl: '/front/tasks/decision.html'})
        .when('/tasks/:task_id/approve', {templateUrl: '/front/tasks/approve.html'})
        .when('/tasks/:task_id/check', {templateUrl: '/front/tasks/check.html'})
        .when('/tasks/:task_id/create', {templateUrl: '/front/tasks/create.html'})
        .when('/skills', {templateUrl: '/front/skills/skills.html', controller: 'skillsCtrl'})
        .when('/users/:user_id', {templateUrl: '/front/users/one.html', controller: 'profileCtrl'})
        .when('/competences', {templateUrl: '/front/competences/competences.html', controller: 'competencesCtrl'})
        .when('/registration', {templateUrl: '/front/users/registration.html', controller: 'registrationCtrl'})
        .when('/registration/step2', {templateUrl: '/front/users/registration.html', controller: 'registrationCtrl'})
        .when('/registration/nick/:nick/email/:email/password/:password*',
        {templateUrl: '/front/users/registration.html', controller: 'registrationCtrl'})
        .when('/restore', {templateUrl: '/front/users/restore.html', controller: 'restoreCtrl'})
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
});

app.run(function ($rootScope, $http, loadLoggedUser, extendedSkills, appendProgressToExs, $q) {
    $rootScope.ajaxCall = $q.defer();

    $rootScope.navbarSelectedIndex = 0;
    $rootScope.$on('$locationChangeSuccess', function (obj, newVal, oldVal) {
        if ((new RegExp('/main')).test(newVal)) $rootScope.navbarSelectedIndex = 0;
        else if ((new RegExp('/skills')).test(newVal)) $rootScope.navbarSelectedIndex = 1;
        else if ((new RegExp('/tasks')).test(newVal)) $rootScope.navbarSelectedIndex = 2;
        else if ((new RegExp('/users')).test(newVal)) $rootScope.navbarSelectedIndex = 3;
        else if ((new RegExp('/competences')).test(newVal)) $rootScope.navbarSelectedIndex = 4;
        else if ((new RegExp('/admin')).test(newVal)) $rootScope.navbarSelectedIndex = -1;
    });

    loadLoggedUser(function(user) {
        if (user) {
            $http.get('db/skills').success(function (data) {
                if (data) {
                    $rootScope.exs = new extendedSkills(data);
                    appendProgressToExs();
                }
                $rootScope.ajaxCall.resolve();
            });
        } else $rootScope.ajaxCall.resolve();
    });

    /*    FB.init({
     appId      : '490483854451281',
     status     : true,
     xfbml      : true,
     version    : 'v2.3'
     });*/

});

app.controller('navbarCtrl', function ($scope, $http, $routeParams, $location, $rootScope, $timeout, extendedSkills,
                                       isLoggedIn, loadLoggedUser, $mdDialog, $mdToast, loggedUser, appendProgressToExs) {
    $scope.loginErr = {loginerr: false};

    $scope.getSelectedIndex = function () {
        return $rootScope.navbarSelectedIndex;
    };

    $scope.isLoggedIn = isLoggedIn;

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
            templateUrl: '/front/users/login.html',
            targetEvent: ev
        });
    };

    $scope.logout = function () {
        $http.get('/logout').success(function (data) {
            loadLoggedUser(function () {
                $location.path(data);
            });
        });
    };

});

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

app.controller('mainPageCtrl', function ($scope, $http, isLoggedIn, $location, $timeout, parseSkills, loggedUser,
                                         $mdToast, $rootScope, loadLoggedUser, getObjByID, completedSkills,
                                         skillsToIDs, $mdSidenav) {
    $scope.isLoggedIn = isLoggedIn;
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

        $http.post('/db/tasks', {filters: {for_solving: true, received: true}}).success(function (data) {
            for (var i in data) parseSkills(data[i]);
            $scope.tasksReceived = data;
            $scope.calculateDifficulty(data, $scope.user);
            for (var i in $scope.tasksReceived) $scope.tasksReceived[i].received = true;
        });

        $http.post('/db/tasks', {
            filters: {for_solving: true, received: false},
            skills: skillsToIDs($scope.user.skills)
        })
            .success(function (data) {
                for (var i in data) parseSkills(data[i]);
                $scope.tasksRecommended = data;
                $scope.calculateDifficulty(data, $scope.user);
            });

        $http.post('/db/solutions', {
            filters: {for_checking: true},
            skills: skillsToIDs($scope.user.completedSkills)
        }).success(function (data) {
            for (var i in data) parseSkills(data[i]);
            $scope.solutionsForChecking = data;
        });

        $http.post('/db/tasks', {
            filters: {for_approving: true},
            skills: skillsToIDs($scope.user.completedSkills)
        }).success(function (data) {
            for (var i in data) parseSkills(data[i]);
            $scope.tasksForApproving = data;
        });


        $scope.temp = {}; //связывает ng-model элемента input директивы tasks-list и temp.solution

        $scope.selectedTab = 0;

        $scope.next = function () {
            if ($scope.selectedTab < 3) $scope.selectedTab++;
        };
        $scope.previous = function () {
            if ($scope.selectedTab > 0) $scope.selectedTab--;
        };

        $scope.sendTask = {title: '', description: '', links: [], link: '', skills: []};

        $scope.addLink = function () {
            if (!$scope.sendTask.link) {
                $scope.showToast('Введите ссылку!');
                return;
            }
            if (_.includes($scope.sendTask.links, $scope.sendTask.link)) {
                $scope.showToast('Такая ссылка уже добавлена!');
                return;
            }
            $scope.sendTask.links.push($scope.sendTask.link);
            $scope.sendTask.link = '';
        };

        $scope.removeLink = function (index) {
            $scope.sendTask.links.splice(index, 1);
        };

        $scope.addSkill = function(skill) {
            var s = {skill_id: skill.skill_id, count: 0.5};
            $scope.sendTask.skills.push(s);
            $scope.user.completedSkills.splice($scope.user.completedSkills.indexOf(skill), 1);
        };

        $scope.removeSkill = function(skill_id, count) {
            for (var i in $scope.sendTask.skills)
                if ($scope.sendTask.skills[i].skill_id == skill_id) {
                    $scope.sendTask.skills.splice(i, 1);
                    break;
                }
            $scope.user.completedSkills.push({skill_id: skill_id, title: $rootScope.exs.skills[skill_id].title});
        };

        $scope.showSidenavSkills = function()
        {
            $mdSidenav('right').toggle()
                .then(function () {

                });
        };

        $scope.createTask = function () {
            if ($scope.sendTask.title.length < 10) return;
            if ($scope.sendTask.description.length < 30) return;
            if (!$scope.sendTask.skills.length) {
                $scope.showToast('Прикрепите умения к заданию!');
                return;
            }
            if (!$scope.sendTask.links.length) {
                $scope.showToast('Добавьте ссылки на учебные материалы!');
                return;
            }
            $http.post('/create_task', $scope.sendTask).success(function (data) {
                if (!data) {
                    $scope.showToast('Ошибка при создании задания! Попробуйте еще раз...');
                    return;
                }

                $scope.showToast('Задание успешно создано!', '#toastSuccess');
                $scope.sendTask = {title: '', description: '', links: [], link: '', skills: []};

                loadLoggedUser();
            });
        };
    });
});