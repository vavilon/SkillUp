(function () {
    angular
        .module('skillup')
        .directive('skupNotification', skupNotification);

    skupNotification.$inject = ['templates'];

    function skupNotification(templates) {
        return {
            restrict: 'E',
            templateUrl: templates.notification.templateUrl,
            scope: {},
            link: link,
            controller: NotificationController
        };

        function link(scope, element, attrs) {

        }
    }

    NotificationController.$inject = [];

    function NotificationController($scope) {

    }
})();