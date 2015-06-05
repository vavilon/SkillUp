app.controller('usersListCtrl', function ($scope, $http, $filter, getObjByID) {
    $scope.username = "";
    $scope.filteredUsers = [];

    $http.get('db/users').success(function (data) {
        $scope.users = data;
        $scope.lastExpandedUser = $scope.users[0];
    });
    $http.get('db/skills').success(function (data) {
        $scope.skills = data;
    });

    $scope.findSkill = function (id) {
        return getObjByID(id, $scope.skills);
    };

    var orderBy = $filter('orderBy');

    $scope.order = function (predicate, reverse) {
        $scope.users = orderBy($scope.users, predicate, reverse);
    };

    $scope.order('-exp', false);

    $scope.expand = function (user) {
        if ($scope.lastExpandedUser !== user) $scope.lastExpandedUser.expanded = false;
        user.expanded = !user.expanded;
        $scope.lastExpandedUser = user;
    };

    $scope.$watch('username', function (newval, oldval) {
        if ($scope.lastExpandedUser) $scope.lastExpandedUser.expanded = false;
    });
});

app.controller('profileCtrl', function ($scope, $routeParams, $http, getObjByID) {
        $scope.lol = function(param) {
          console.log(param);
        };

        $scope.categoryNum = 0;

        $scope.findTask = function (id) {
            return getObjByID(id, $scope.tasks);
        };

        $scope.findSkill = function (id) {
            return getObjByID(id, $scope.skills);
        };

        $http.get('db/users').success(function (data) {
            $scope.users = data;
            $scope.user = getObjByID($routeParams.user_id, $scope.users);
            if ($scope.user.education) {
                var res1 = [];
                for (var i in $scope.user.education) {
                    res1.push(JSON.parse($scope.user.education[i]));
                }
                res1 = res1.reverse();
                $scope.user.education = res1;
            }
            if ($scope.user.work) {
                var res2 = [];
                for (i in $scope.user.work) {
                    res2.push(JSON.parse($scope.user.work[i]));
                }
                res2 = res2.reverse();
                $scope.user.work = res2;
            }
            $http.get('db/tasks').success(function (data) {
                $scope.tasks = data;
                $scope.tasks_done = [];
                $scope.tasks_checked = [];
                $scope.tasks_approved = [];
                $scope.tasks_created = [];

                if ($scope.user.tasks_done)
                for (var i = 0; i < $scope.user.tasks_done.length; i++) {
                    $scope.tasks_done.push($scope.findTask($scope.user.tasks_done[i]));
                }

                if ($scope.user.tasks_checked)
                for (i = 0; i < $scope.user.tasks_checked.length; i++) {
                    $scope.tasks_checked.push($scope.findTask($scope.user.tasks_checked[i]));
                }

                if ($scope.user.tasks_approved)
                for (i = 0; i < $scope.user.tasks_approved.length; i++) {
                    $scope.tasks_done.push($scope.findTask($scope.user.tasks_approved[i]));
                }

                if ($scope.user.tasks_created)
                for (i = 0; i < $scope.user.tasks_created.length; i++) {
                    $scope.tasks_created.push($scope.findTask($scope.user.tasks_created[i]));
                }
            });
        });
        $http.get('db/skills').success(function (data) {
            $scope.skills = data;
        });
        $http.get('db/solutions').success(function (data) {
            $scope.solutions = data;
        });

        $scope.tabSelected = 0;

    }
);

app.controller('registrationCtrl', function ($scope, $routeParams, $http, $location, getIsLoggedIn, isImage,
                                             $mdToast, $animate, $timeout) {
        $scope.reg = {};

        $scope.step = 2;

        $scope.reg.nick = $routeParams.nick === '0' ? '' : $routeParams.nick;
        $scope.reg.email = $routeParams.email === '0' ? '' : $routeParams.email;
        $scope.reg.password = $routeParams.password === '0' ? '' : $routeParams.password;

        $scope.showSuccessToast = function () {
            $mdToast.show(
                $mdToast.simple()
                    .content('Вы успешно зарегистрированы!')
                    .position('top left')
                    .hideDelay(3000)
            );
        };

        $scope.showErrorToast = function () {
            $mdToast.show(
                $mdToast.simple()
                    .content('Не удалось зарегистрироваться.\nПопробуйте позже...')
                    .position('top left')
                    .hideDelay(3000)
            );
        };

        $scope.passwordsEqual = function () {
            var err = {notequal: false};
            if (!$scope.reg.password) return err;
            if (!$scope.reg.rePassword) return err;
            if ($scope.reg.password !== $scope.reg.rePassword) err.notequal = true;
            return err;
        };

        $scope.vRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        $scope.validateEmail = function() {
            return $scope.vRegex.test($scope.reg.email);
        };
        $scope.validatePasswords = function() {
            return $scope.reg.password === $scope.reg.rePassword;
        };

        $scope.exists = {nick: false, email: false, emailnotvalid: false};
        $scope.checkNick = function() {
            $http.post('/check_nick', {nick: $scope.reg.nick}).success(function (data) {
                $scope.exists.nick = data ? false : true;
            });
        };
        $scope.checkEmail = function() {
            $http.post('/check_email', {email: $scope.reg.email}).success(function (data) {
                $scope.exists.email = data ? false : true;
            });
        };

        $scope.$watch('reg.nick', function(newVal, oldVal) {
            if (newVal) {
                $scope.checkNick();
            }
            else $scope.exists.nick = false;
        });

        $scope.$watch('reg.email', function(newVal, oldVal) {
            console.log('Watching email...');
            if (newVal) {
                if (!$scope.validateEmail()) {
                    $scope.exists.emailnotvalid = true;
                    return;
                }
                $scope.exists.emailnotvalid = false;
                $scope.checkEmail();
            }
            else {
                $scope.exists.emailnotvalid = false;
                $scope.exists.email = false;
            }
        });

        $scope.checkRegInput = function () {
            return $scope.validateEmail() && $scope.validatePasswords() && !$scope.exists.nick && !$scope.exists.email;
        };

        $scope.register = function () {
            console.log('Check result: ' + $scope.checkRegInput());
            if (!$scope.checkRegInput()) return;
            $http.post('/register', {
                nick: $scope.reg.nick,
                name: $scope.reg.name,
                email: $scope.reg.email,
                password: $scope.reg.password
            })
                .success(function (data) {
                    if (!data) {
                        $scope.showErrorToast();
                        return;
                    }
                    $scope.step = 2;
                });
        };

        $scope.isImageRes = false;
        $scope.isImage = function() {
            console.log('im here');
            console.log($scope.reg.imgSrc);
            isImage($scope.reg.imgSrc).then(function(result) {
                $scope.isImageRes = result;
                $scope.reg.imgSrcRes = $scope.reg.imgSrc;
            });
        };

        $scope.reg.gender = 'мужской';
        $scope.reg.education = [];
        $scope.reg.work = [];
        var maxYear = (new Date()).getFullYear();
        $scope.range = [];
        for (var i = maxYear; i > 1929; i--) {
            $scope.range.push(i);
        }
        $scope.addEducation = function () {
            if (!$scope.reg.edName) return;
            var e = {school: {name: $scope.reg.edName}};
            if ($scope.reg.edConc) e.concentration = [{name: $scope.reg.edConc}];
            if ($scope.reg.edYear) e.year = {name: $scope.reg.edYear};

            $scope.reg.education.push(e);
            $scope.reg.edName = null;
            $scope.reg.edConc = null;
            $scope.reg.edYear = null;
        };
        $scope.addWork = function () {
            if (!$scope.reg.woName) return;
            var w = {employer: {name: $scope.reg.woName}};
            if ($scope.reg.woPosition) w.position = {name: $scope.reg.woPosition};
            if ($scope.reg.woStartDate) w.start_date = $scope.reg.woStartDate;
            if ($scope.reg.woEndDate) w.end_date = $scope.reg.woEndDate;

            $scope.reg.work.push(w);
            $scope.reg.woName = null;
            $scope.reg.woPosition = null;
            $scope.reg.woStartDate = null;
            $scope.reg.woEndDate = null;
        };

/*        $scope.loginWithFacebook = function() {

            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    var uid = response.authResponse.userID;
                    var accessToken = response.authResponse.accessToken;
                    FB.api('/me', function(response) {
                        console.log(response);
                    });
                } else if (response.status === 'not_authorized') {
                    FB.login(function(response) {
                        if (response.authResponse) {
                            console.log('Welcome!  Fetching your information.... ');
                            FB.api('/me', function(response) {
                                console.log(response);
                            });
                        } else {
                            console.log('User cancelled login or did not fully authorize.');
                        }
                    });
                } else {
                    // the user isn't logged in to Facebook.
                }
            });

        };*/
    }
);