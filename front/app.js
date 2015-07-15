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

app.run(function ($rootScope, $http, getIsLoggedIn, extendedSkills) {
    getIsLoggedIn();
    $rootScope.navbarSelectedIndex = 0;
    $rootScope.$on('$locationChangeSuccess', function (obj, newVal, oldVal) {
        if ((new RegExp('/main')).test(newVal)) $rootScope.navbarSelectedIndex = 0;
        else if ((new RegExp('/skills')).test(newVal)) $rootScope.navbarSelectedIndex = 1;
        else if ((new RegExp('/tasks')).test(newVal)) $rootScope.navbarSelectedIndex = 2;
        else if ((new RegExp('/users')).test(newVal)) $rootScope.navbarSelectedIndex = 3;
        else if ((new RegExp('/competences')).test(newVal)) $rootScope.navbarSelectedIndex = 4;
    });

    $http.get('db/skills').success(function (data) {
        if (data) {
            $rootScope.exs = new extendedSkills(data);
        }
    });

    /*    FB.init({
     appId      : '490483854451281',
     status     : true,
     xfbml      : true,
     version    : 'v2.3'
     });*/

});

app.controller('navbarCtrl', function ($scope, $http, $routeParams, $location, $rootScope, $timeout, extendedSkills,
                                       isLoggedIn, getIsLoggedIn, $mdDialog, $mdToast, loggedUser) {
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
                getIsLoggedIn(function (user) {
                    if (user) {
                        $http.get('db/skills').success(function (skills) {
                            if (skills) {
                                $rootScope.exs = new extendedSkills(skills);
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
            getIsLoggedIn(function () {
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
                                         $mdToast, $rootScope, getIsLoggedIn, getObjByID, setLiked, completedSkills,
                                         setReceived, skillsProgressToIDs) {
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

    $scope.exs = $rootScope.exs;
    if (!$scope.exs) return;

    $scope.chips = {skillsTitles: [], skillsTitlesFiltered: [], selectedSkills: []};

    $scope.chips.filteredSkills = function () {
        var str = angular.lowercase($scope.chips.searchTextSkills);
        var arr = [];
        for (var i in $scope.chips.skillsTitlesFiltered) {
            if (angular.lowercase($scope.chips.skillsTitlesFiltered[i]).indexOf(str) !== -1)
                arr.push($scope.chips.skillsTitlesFiltered[i]);
        }
        return arr;
    };

    $scope.skillsTitles = [];

    for (var i in $scope.exs.skills) {
        $scope.chips.skillsTitles.push($scope.exs.skills[i].title);
    }

    $scope.$watchCollection('chips.selectedSkills', function (newVal) {
        if (newVal.length === 0) {
            $scope.chips.skillsTitlesFiltered = $scope.chips.skillsTitles;
            return;
        }
        $scope.chips.skillsTitlesFiltered = [];
        var finded = false;
        for (var i in $scope.chips.skillsTitles) {
            finded = false;
            for (var j in newVal) {
                if (newVal[j] === $scope.chips.skillsTitles[i]) {
                    finded = true;
                    break;
                }
            }
            if (!finded) $scope.chips.skillsTitlesFiltered.push($scope.chips.skillsTitles[i]);
        }
    });

    $scope.calculateDifficulty = function (tasks, user) {
        var count = 0;
        for (var i in tasks) {
            count = 0;
            for (var j in tasks[i].skills) {
                for (var k in user.skills) {
                    if (tasks[i].skills[j] === user.skills[k].id) {
                        count += user.skills[k].count / $scope.exs.skills[user.skills[k].id].count_to_get;
                        break;
                    }
                }
            }
            tasks[i].difficulty = count / tasks[i].skills.length;
        }
    };

    var user = loggedUser();

    $http.post('/db/tasks', {filters: {for_solving: true, received: true}}).success(function(data) {
        $scope.tasksReceived = data;
        $scope.calculateDifficulty(data, user);
        for (var i in $scope.tasksReceived) $scope.tasksReceived[i].received = true;
        setLiked($scope.tasksReceived, user.tasks_liked, true);
    });

    $http.post('/db/tasks', {filters: {for_solving: true, received: false}, skills: skillsProgressToIDs(user.skills)})
        .success(function(data) {
            $scope.tasksRecommended = data;
            $scope.calculateDifficulty(data, user);
            setLiked($scope.tasksRecommended, user.tasks_liked, true);
    });

    $http.post('/db/tasks', {filters: {for_approving: true}, skills: completedSkills(user.skills)}).success(function(data) {
        $scope.tasksForApproving = data;
    });

    $http.post('/db/solutions', {filters: {for_checking: true}, skills: completedSkills(user.skills)}).success(function (data) {
        $scope.solutionsForChecking = data;
        setLiked($scope.solutionsForChecking, user.solutions_liked, true);
    });

    $scope.temp = {}; //связывает ng-model элемента input директивы tasks-list и temp.solution

    $scope.selectedTab = 0;

    $scope.next = function () {
        $scope.data.selectedIndex = Math.min($scope.data.selectedIndex + 1, $scope.tooltips.length - 1);
    };
    $scope.previous = function () {
        $scope.data.selectedIndex = Math.max($scope.data.selectedIndex - 1, 0);
    };

    $scope.sendTask = {name: '', description: '', links: [], link: ''};

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

    $scope.createTask = function () {
        if ($scope.sendTask.name.length < 10) return;
        if ($scope.sendTask.description.length < 30) return;
        if ($scope.chips.selectedSkills.length === 0) {
            $scope.showToast('Прикрепите умения к заданию!');
            return;
        }
        if ($scope.sendTask.links.length === 0) {
            $scope.showToast('Добавьте ссылки на учебные материалы!');
            return;
        }
        for (var i in $scope.tasksObj) {
            if ($scope.sendTask.name === $scope.tasksObj[i].title) {
                $scope.showToast('Задание с таким названием уже существует!');
                return;
            }
        }
        var obj = {
            title: $scope.sendTask.name, description: $scope.sendTask.description, links: $scope.sendTask.links,
            skills: []
        };
        for (var i in $scope.chips.selectedSkills) {
            for (var j in $scope.exs.skills) {
                if ($scope.chips.selectedSkills[i] === $scope.exs.skills[j].title) {
                    obj.skills.push(j);
                    break;
                }
            }
        }
        $http.post('/create_task', obj).success(function (data) {
            if (!data) {
                $scope.showToast('Ваших умений недостаточно, чтобы создать такое задание!');
                return;
            }

            $scope.showToast('Задание успешно создано!', '#toastSuccess');
            $scope.sendTask = {name: '', description: '', links: [], link: ''};
            $scope.chips.skillsTitlesFiltered = [];
            $scope.chips.selectedSkills = [];

            getIsLoggedIn();
        });
    };
});