(function () {
    angular
        .module('skillup')
        .controller('NotificationsController', NotificationsController);

    NotificationsController.$inject = ['$scope', 'notifications', 'ScrollLoader'];

    function NotificationsController($scope, notifications, ScrollLoader)
    {
        $scope.notifications = [];

        $scope.onNotsLoaded = function(nots) {
            $scope.notifications = $scope.notifications.concat(nots);
            notifications.setRead(nots);
        };

        $scope.scrollLoader = ScrollLoader($scope, {
            events: 'notificationsScrolled',
            method: 'post',
            url: '/notifications',
            body: {read: false},
            onLoadEnd: $scope.onNotsLoaded
        });

        $scope.scrollLoader.loadMoreData();
    }
})();
