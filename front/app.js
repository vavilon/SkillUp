var app = angular.module('skills', [
    'ngRoute',
    'ngMaterial',
    'ngAnimate',
    'hljs'
]);

app.config(function ($locationProvider, $routeProvider, $mdThemingProvider, hljsServiceProvider) {
    $locationProvider.html5Mode(true);

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
        .when('/login', {templateUrl: '/front/users/login.html', controller: 'loginCtrl'})
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
}).run(function($rootScope) {
    $rootScope.navbarSelectedIndex = 0;
    $rootScope.$on('$locationChangeSuccess', function(obj, newVal, oldVal) {
        if ((new RegExp('/main')).test(newVal)) $rootScope.navbarSelectedIndex = 0;
        else if ((new RegExp('/skills')).test(newVal)) $rootScope.navbarSelectedIndex = 1;
        else if ((new RegExp('/tasks')).test(newVal)) $rootScope.navbarSelectedIndex = 2;
        else if ((new RegExp('/users')).test(newVal)) $rootScope.navbarSelectedIndex = 3;
        else if ((new RegExp('/competences')).test(newVal)) $rootScope.navbarSelectedIndex = 4;
    });

});

app.factory('getObjByID', function() {
    return function(id, collection) {
        for (var elem in collection)
            if (collection[elem].id === id) return collection[elem];
    }
});

app.controller('navbarCtrl', function ($scope, $http, $routeParams, $location, $rootScope) {
    $http.get('models/users.json').success(function (data) {
        $scope.users = data;
    });

    $scope.getSelectedIndex = function () {
        return $rootScope.navbarSelectedIndex;
    };
});

app.controller('mainPageCtrl', function ($scope, $http) {

    $scope.selectedTab = 0;

    $scope.next = function () {
        $scope.data.selectedIndex = Math.min($scope.data.selectedIndex + 1, $scope.tooltips.length - 1);
    };
    $scope.previous = function () {
        $scope.data.selectedIndex = Math.max($scope.data.selectedIndex - 1, 0);
    };
});

app.directive('tasksSolveList', function(getObjByID) {
    return {
        restrict: 'E',
        templateUrl: '/front/templates/taskssolvelist.html',

        controller: function($http, $scope) {
            $http.get('models/skills.json').success(function (data) {
                $scope.skillsObj = data;
            });
            $http.get('models/users.json').success(function (data) {
                $scope.usersObj = data;
            });
            $http.get('models/tasks_list.json').success(function (data) {
                $scope.tasksObj = data;
                $scope.lastExpandedTask = $scope.tasksObj[Object.keys($scope.tasksObj)[0]];
                $scope.lastExpandedTask.expanded = false;
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

app.controller('logoutCtrl', function ($scope, $http, $routeParams, $location) {
    $scope.logout = function() {
        $http.get('/logout').success(function (data) {
            alert('You logged out!');
            $location.path(data);
        });
    };
});