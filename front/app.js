var app = angular.module('skills',[
    'ngRoute',
    'allProfilesFilters',
    'ngMaterial',
    'ngAnimate',
    'hljs'
]);

app.config(function($locationProvider,$routeProvider,$mdThemingProvider,hljsServiceProvider){
    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/main', {templateUrl:'/front/main.html', controller: 'mainPageCtrl'})
        .when('/users', {templateUrl:'/front/users/all.html'})
        .when('/tasks', {templateUrl:'/front/tasks/all.html', controller:'allTasksCtrl'})
        .when('/tasks/:task_id', {templateUrl:'/front/tasks/one.html', controller:'oneTaskCtrl'})
        .when('/tasks/:task_id/decision', {templateUrl:'/front/tasks/decision.html'})
        .when('/tasks/:task_id/approve', {templateUrl:'/front/tasks/approve.html'})
        .when('/tasks/:task_id/check', {templateUrl:'/front/tasks/check.html'})
        .when('/tasks/:task_id/create', {templateUrl:'/front/tasks/create.html'})
        .when('/skills', {templateUrl:'/front/skills/skills.html', controller:'skillsCtrl'})
        .when('/users/:user_id', {templateUrl: '/front/users/one.html', controller:'profileCtrl'})
        .when('/competences', {templateUrl: '/front/competences/competences.html', controller:'competencesCtrl'})
        .otherwise({redirectTo: '/main'});

    $mdThemingProvider.theme('default')
        .primaryPalette('indigo', {
            'default': '500',
            'hue-1': '300',
            'hue-2': '800',
            'hue-3': 'A100'})
        .accentPalette('pink', {
            'default': '400',
            'hue-1': '300',
            'hue-2': '800',
            'hue-3': 'A100'})
        .warnPalette('red', {
            'default': '500',
            'hue-1': '300',
            'hue-2': '800',
            'hue-3': 'A100'});

    hljsServiceProvider.setOptions({
        tabReplace: '    '
    });
});

app.filter('objectByKeyValFilter', function () {
    return function (input, filterKey, filterVal) {
        var filteredInput = {};
        angular.forEach(input, function(value, key) {
            if(value[filterKey] && (new RegExp(filterVal, "i")).test(value[filterKey])) {
                filteredInput[key]= value;
            }
        });
        return filteredInput;
    }});

app.filter('objectByKeyValFilterArr', function () {
    return function (input, filterKey, filterVal) {
        var filteredInput = [];
        angular.forEach(input, function(value, key) {
            if(value[filterKey] && (new RegExp(filterVal, "i")).test(value[filterKey])) {
                filteredInput.push(value);
            }
        });
        return filteredInput;
    }});

app.factory('navbarSelectedIndex', function() {
    var selectedIndex = 0;
    var service = {};
    service.set = function(index) {
        selectedIndex = index;
    };
    service.get = function() {
        return selectedIndex;
    };
    return service;
});

app.controller('navbarCtrl',['$scope', '$http', '$routeParams', '$location', 'navbarSelectedIndex',
    function($scope, $http, $routeParams, $location, navbarSelectedIndex) {
        $http.get('models/users.json').success(function(data) {
            $scope.users = data;
        });
        $scope.getNavbarSelectedIndex = navbarSelectedIndex.get;
        if((new RegExp('/main')).test($location.url())) navbarSelectedIndex.set(0);
        else if((new RegExp('/skills')).test($location.url())) navbarSelectedIndex.set(1);
        else if((new RegExp('/tasks')).test($location.url())) navbarSelectedIndex.set(2);
        else if((new RegExp('/users')).test($location.url())) navbarSelectedIndex.set(3);
        else if((new RegExp('/competences')).test($location.url())) navbarSelectedIndex.set(4);
        $scope.goToMain = function(){$location.path('/main'); navbarSelectedIndex.set(0);};
        $scope.goToSkills = function(){$location.path('/skills'); navbarSelectedIndex.set(1);};
        $scope.goToTasks = function(){$location.path('/tasks'); navbarSelectedIndex.set(2);};
        $scope.goToUsers = function(){$location.path('/users'); navbarSelectedIndex.set(3);};
        $scope.goToCompetences = function(){$location.path('/competences'); navbarSelectedIndex.set(4);};
    }]);

app.controller('mainPageCtrl', ['$scope', '$http', function($scope, $http)
{
    $http.get('models/skills.json').success(function(data) {
        $scope.skills = data;
    });
    $http.get('models/users.json').success(function(data) {
        $scope.users = data;
    });
    $http.get('models/tasks_list.json').success(function(data) {
        $scope.tasks = data;
        $scope.lastExpandedTask = $scope.tasks[Object.keys($scope.tasks)[0]];
        $scope.lastExpandedTask.expanded = false;
    });
    $http.get('models/solutions.json').success(function(data) {
        $scope.solutions = data;
    });

    $scope.tooltips = ['Решить', 'Проверить', 'Подтвердить', 'Создать'];
    $scope.tooltipsShow = [true, false, false, false];
    $scope.tooltipClicked = 0;
    $scope.tooltipsMSOver = function(index) {
        for (var i = 0; i < $scope.tooltipsShow.length; i++) if (i != $scope.tooltipClicked) $scope.tooltipsShow[i] = false;
        $scope.tooltipsShow[index] = true;
    };
    $scope.tooltipsMSLeave = function(index) {
        for (var i = 0; i < $scope.tooltipsShow.length; i++) $scope.tooltipsShow[i] = false;
        $scope.tooltipsShow[$scope.tooltipClicked] = true;
    };
    $scope.tooltipsClick = function(index) {
        for (var i = 0; i < $scope.tooltipsShow.length; i++) if (i != index) $scope.tooltipsShow[i] = false;
        $scope.tooltipClicked = index;
    };

    $scope.findUser = function(id) {
        for(var user in $scope.users)
            if($scope.users[user].id === id) return $scope.users[user];
    };

    $scope.expand = function(task) {
        if ($scope.lastExpandedTask !== task) $scope.lastExpandedTask.expanded = false;
        task.expanded = !task.expanded;
        $scope.lastExpandedTask = task;
    };

    $scope.data = {
        selectedIndex : 0,
        secondLocked : true,
        secondLabel : "Item Two"
    };
    $scope.next = function() {
        $scope.data.selectedIndex = Math.min($scope.data.selectedIndex + 1, $scope.tooltips.length - 1) ;
    };
    $scope.previous = function() {
        $scope.data.selectedIndex = Math.max($scope.data.selectedIndex - 1, 0);
    };
}]);