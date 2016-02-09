(function () {
    angular
        .module('skillup')
        .factory('notifications', notifications);

    notifications.$inject = ['$http'];

    function notifications($http) {
        var count = 0;
        var desc = 0;

        var service = {
            get count() { return count; },
            getCount: getCount,
            setRead: setRead,
            startListening: startListening,
            stopListening: stopListening
        };

        return service;

        function getCount() {
            $http.get('/notifications/count').success(function(res) {
                count = res.count;
            });
        }

        function setRead(notifications) {
            var params = {ids: []};
            for (var i in notifications) params.ids.push(notifications[i].id);
            $http.post('/notifications/read', params).success(function(res) {
                if (!res) { /* TODO: some error handling */ }
            });
        }

        function startListening() {
            desc = setInterval(getCount, 30000);
        }

        function stopListening() {
            clearInterval(desc);
        }
    }
})();