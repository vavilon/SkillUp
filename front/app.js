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
        .when('/registration/nick/:nick/email/:email/password/:password*',
        {templateUrl: '/front/users/registration.html', controller: 'registrationCtrl'})
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

app.factory('getObjByID', function() {
    return function(id, collection) {
        for (var elem in collection)
            if (collection[elem].id === id) return collection[elem];
    }
});

//Вызывается в run, а также при регистрации, входе и выходе
app.factory('getIsLoggedIn', function($rootScope, $http) {
    return function(callback) {
        $http.get('/is_logged_in').success(function (data) {
            $rootScope.loggedUser = data;
            callback && callback(data);
        });
    }
});

//Вызывается в ng-show или ng-if, чтобы определить, что показывать в зависимости от того, вошел юзер или не вошел
app.factory('isLoggedIn', function($rootScope){
    return function() {
        return $rootScope.loggedUser ? true : false;
    }
});

app.factory('loggedUser', function($rootScope) {
    return function() {
        return $rootScope.loggedUser;
    }
});

app.factory('isImage', function($q) {
    return  function(src) {
        var deferred = $q.defer();
        var image = new Image();
        image.onerror = function() {
            deferred.resolve(false);
        };
        image.onload = function() {
            deferred.resolve(true);
        };
        image.src = src;
        return deferred.promise;
    };
});

app.factory('educationStr', function() {
    return function(education) {
        var educationStr = [], s = '', buff = {};
        for (var i in education) {
            buff = education[i];
            s = buff.school.name;
            if (buff.year && buff.year.name) s += ' (' + buff.year.name + ')';
            if (buff.concentration && buff.concentration[0] && buff.concentration[0].name) {
                s += ', ' + buff.concentration[0].name;
            }
            educationStr.push(s);
        }
        return educationStr.reverse();
    };
});

app.factory('workStr', function($filter) {
    return function(work) {
        var workStr = [], s = '', buff = {};
        for (var i in work) {
            buff = work[i];
            s = buff.employer.name;
            if (buff.start_date || buff.end_date) {
                s += ' (';
                if (buff.start_date) s += 'с ' + $filter('date')(buff.start_date, 'MMMM yyyy');
                if (buff.start_date && buff.end_date) s += ' ';
                if (buff.end_date) s += 'по ' + $filter('date')(buff.end_date, 'MMMM yyyy');
                s += ')'
            }
            if (buff.position && buff.position.name) s += ', ' + buff.position.name;
            workStr.push(s);
        }
        return workStr.reverse();
    };
});

app.factory('parseSkills', function() {
    return function(skills) {
        skills = skills.replace(/{/g, '[');
        skills = skills.replace(/}/g, ']');
        skills = skills.replace(/"\(/g, '{"id": "');
        skills = skills.replace(/\)"/g, '}');
        skills = skills.replace(/},{/g, '} , {');
        skills = skills.replace(/(\S),/g, '$1", "count": ');
        return JSON.parse(skills);
    }
});

app.run(function($rootScope, $http, getIsLoggedIn, extendedSkills) {
    getIsLoggedIn();
    $rootScope.navbarSelectedIndex = 0;
    $rootScope.$on('$locationChangeSuccess', function(obj, newVal, oldVal) {
        if ((new RegExp('/main')).test(newVal)) $rootScope.navbarSelectedIndex = 0;
        else if ((new RegExp('/skills')).test(newVal)) $rootScope.navbarSelectedIndex = 1;
        else if ((new RegExp('/tasks')).test(newVal)) $rootScope.navbarSelectedIndex = 2;
        else if ((new RegExp('/users')).test(newVal)) $rootScope.navbarSelectedIndex = 3;
        else if ((new RegExp('/competences')).test(newVal)) $rootScope.navbarSelectedIndex = 4;
    });

    $http.get('db/skills').success(function(data){
        if (data) {
            $rootScope.exs = new extendedSkills(data);
        }
    });

    FB.init({
        appId      : '490483854451281',
        status     : true,
        xfbml      : true,
        version    : 'v2.3'
    });

});

app.controller('navbarCtrl', function ($scope, $http, $routeParams, $location, $rootScope, $timeout,
                                       isLoggedIn, getIsLoggedIn, $mdDialog, $mdToast, loggedUser) {
    $scope.loginErr = {loginerr: false};

    $scope.getSelectedIndex = function () {
        return $rootScope.navbarSelectedIndex;
    };

    $scope.isLoggedIn = isLoggedIn;

    $scope.loggedUser = loggedUser;

    $rootScope.$watch('loginData', function(newVal) {
        if (newVal) $scope.login(newVal.email, newVal.password);
    });

    $scope.login = function(email, password) {
        $http.post('/login', { email: email, password: password })
            .success(function (data) {
                if (!data) {
                    $rootScope.loginErr = {loginerr: true};
                    $timeout(function() {
                        $rootScope.loginErr = {loginerr: false};
                    }, 3000);
                    return;
                }
                getIsLoggedIn(function(user){
                    $mdDialog.hide();
                    $location.path(data);
                });
            });
    };

    $scope.showLoginDialog = function(ev) {
        $mdDialog.show({
            controller: LoginDialogController,
            templateUrl: '/front/users/login.html',
            targetEvent: ev
        });
    };

    $scope.logout = function() {
        $http.get('/logout').success(function (data) {
            getIsLoggedIn(function(){
                $location.path(data);
            });
        });
    };

});

function LoginDialogController($scope, $mdDialog, $rootScope) {
    $scope.log = {};

    $scope.hide = function() {
        $scope.log.email = 'loh';
        $scope.log.password = 'loh';
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $scope.log.email = 'loh';
        $scope.log.password = 'loh';
        $mdDialog.hide();
    };
    $scope.answer = function() {
        if (!$scope.log.email || !$scope.log.password) return;
        $rootScope.loginData = {email: $scope.log.email, password: $scope.log.password};
    };

    $scope.getLoginErr = function () {
        return $rootScope.loginErr;
    };

}

app.controller('mainPageCtrl', function ($scope, $http, isLoggedIn, $location, $timeout, parseSkills, loggedUser,
                                         $mdToast, $rootScope, extendedSkills) {
    $scope.selectedTab = 0;
    $scope.reg = {email: '', password: ''};

    //Следующий блок кода нужен для того, чтобы избежать бага с плейсхолдером пароля
    var count = 0;
    $scope.$watchCollection('reg', function(newVal, oldVal) {
        if (count < 2) {
            $scope.reg.email = '';
            $scope.reg.password = '';
            count++;
        }
    });

    $scope.chips = {};
    $scope.chips.skillsTitles = [];
    $scope.chips.skillsTitlesFiltered = [];
    $scope.chips.selectedSkills = [];
    $scope.chips.filteredSkills = function() {
        var str = angular.lowercase($scope.chips.searchTextSkills);
        var arr = [];
        for (var i in $scope.chips.skillsTitlesFiltered) {
            if (angular.lowercase($scope.chips.skillsTitlesFiltered[i]).indexOf(str) !== -1)
                arr.push($scope.chips.skillsTitlesFiltered[i]);
        }
        return arr;
    };

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

    $http.get('db/skills').success(function (data) {
        $scope.skillsObj = data;
        $scope.skillsTitles = [];
        for (var i in $scope.skillsObj) {
            $scope.chips.skillsTitles.push($scope.skillsObj[i].title);
        }
    });
    $http.get('db/users').success(function (data) {
        $scope.usersObj = data;
    });
    $http.get('db/tasks').success(function (data) {
        $scope.tasksObj = data;
    });

    $scope.next = function () {
        $scope.data.selectedIndex = Math.min($scope.data.selectedIndex + 1, $scope.tooltips.length - 1);
    };
    $scope.previous = function () {
        $scope.data.selectedIndex = Math.max($scope.data.selectedIndex - 1, 0);
    };
    $scope.isLoggedIn = isLoggedIn;

    $scope.registrationPath = "/registration/";

    $scope.register = function() {
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

    $scope.sendTask = {name: '', description: ''};
    $scope.createTask = function() {
        if ($scope.sendTask.name.length < 10) return;
        if ($scope.sendTask.description.length < 30) return;
        if ($scope.chips.selectedSkills.length === 0) {
            $scope.showToast('Прикрепите умения к заданию!');
            return;
        }
        var obj = {title: $scope.sendTask.name, description: $scope.sendTask.description, skills: []};
        for (var i in $scope.chips.selectedSkills) {
            for (var j in $scope.skillsObj) {
                if ($scope.chips.selectedSkills[i] === $scope.skillsObj[j].title) {
                    obj.skills.push($scope.skillsObj[j].id);
                    break;
                }
            }
        }
        $http.post('/create_task', obj).success(function(data) {
            if (!data) {
                $scope.showToast('Ваших умений недостаточно, чтобы создать такое задание!');
                return;
            }
            $scope.showToast('Задание успешно создано!', '#toastSuccess');
        });
    }
});
