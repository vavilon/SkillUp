app.controller('competencesCtrl', function ($scope, $http, $location, isLoggedIn) {
    if (!isLoggedIn()) { $location.path('/main'); return; }
});