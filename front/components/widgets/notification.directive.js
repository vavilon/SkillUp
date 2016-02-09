(function () {
    angular
        .module('skillup')
        .directive('skupNotification', skupNotification);

    skupNotification.$inject = ['templates'];

    function skupNotification(templates) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: templates.notification.templateUrl,
            scope: {
                notification: '='
            },
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