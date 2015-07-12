app.controller('usersListCtrl', function ($scope, $http, $filter, getObjByID, parseSkills, loadUsers) {
    $scope.username = "";
    $scope.filteredUsers = [];

    $http.get('db/users').success(function (data) {
        $scope.users = data;

        $scope.scrollWrap = {loadFunc: loadUsers, callback: $scope.scrollCallback, offset: $scope.users.length};

        $scope.lastExpandedUser = $scope.users[0];

        for (var i in $scope.users) {
            $scope.users[i].skills = parseSkills($scope.users[i].skills);
        }
    });
    $http.get('db/skills').success(function (data) {
        $scope.skills = data;
    });

    $scope.findSkill = function (id) {
        return getObjByID(id, $scope.skills);
    };
    $scope.expand = function (user) {
        if ($scope.lastExpandedUser !== user) $scope.lastExpandedUser.expanded = false;
        user.expanded = !user.expanded;
        $scope.lastExpandedUser = user;
    };

    $scope.$watch('username', function () {
        if ($scope.lastExpandedUser) $scope.lastExpandedUser.expanded = false;
    });

    $scope.scrollCallback = function(data) {
        for (var i in data) {
            data[i].skills = parseSkills(data[i].skills);
        }
        $scope.users = $scope.users.concat(data);
    };
});

app.controller('profileCtrl', function ($scope, $routeParams, $http, getObjByID, educationStr, workStr, getIsLoggedIn,
                                        loggedUser, parseSkills, loadTasks, loadUsers) {
        $scope.categoryNum = 0;

        $scope.findTask = function (id) {
            return getObjByID(id, $scope.tasks);
        };

        $scope.findSkill = function (id) {
            return getObjByID(id, $scope.skills);
        };

        $http.post('db/users', {ids: [$routeParams.user_id]}).success(function (data) {
            if (!data || !data.length) return;
            $scope.user = data[0];
            $scope.user.skills = parseSkills($scope.user.skills);

            getIsLoggedIn(function () {
                $scope.canEdit = (loggedUser().id === $scope.user.id);
            });

            if ($scope.user.education) {
                $scope.user.educationStr = educationStr(JSON.parse($scope.user.education));
            }
            if ($scope.user.work) {
                $scope.user.workStr = workStr(JSON.parse($scope.user.work));
            }
            $http.get('db/tasks').success(function (tasks) {
                $http.get('db/solutions').success(function (sols) {
                    for (var i in sols) {
                        for (var j in loggedUser().solutions_liked) {
                            if (sols[i].id === loggedUser().solutions_liked[j]) {
                                sols[i].liked = true;
                                break;
                            }
                        }
                    }
                    $scope.solutions = sols;

                    for (i in tasks) {
                        if (loggedUser().tasks_liked && loggedUser().tasks_liked.indexOf(tasks[i].id) !== -1) tasks[i].liked = true;
                        if (loggedUser().tasks_received && loggedUser().tasks_received.indexOf(tasks[i].id) !== -1) tasks[i].received = true;
                    }

                    $scope.tasks = tasks;

                    $scope.scrollWrap = {loadFunc: loadTasks, callback: $scope.scrollCallback,
                        offset: $scope.tasks.length, scrollOptions: {percent: 95, event: 'tasksDoneScrolled'}};

                    $scope.tasks_done = [];
                    $scope.tasks_checked = [];
                    $scope.tasks_approved = [];
                    $scope.tasks_created = [];

                    if ($scope.user.tasks_done)
                        for (i = 0; i < $scope.user.tasks_done.length; i++) {
                            $scope.tasks_done.push($scope.findTask(getObjByID($scope.user.tasks_done[i],$scope.solutions).task_id));
                        }

                    if ($scope.user.tasks_checked)
                        for (i = 0; i < $scope.user.tasks_checked.length; i++) {
                            $scope.tasks_checked.push($scope.findTask($scope.user.tasks_checked[i]));
                        }

                    if ($scope.user.tasks_approved)
                        for (i = 0; i < $scope.user.tasks_approved.length; i++) {
                            $scope.tasks_approved.push($scope.findTask($scope.user.tasks_approved[i]));
                        }

                    if ($scope.user.tasks_created)
                        for (i = 0; i < $scope.user.tasks_created.length; i++) {
                            $scope.tasks_created.push($scope.findTask($scope.user.tasks_created[i]));
                        }
                });
            });
            $http.get('db/skills').success(function (skills) {
                $scope.skills = skills;
            });
        });

        $scope.tabSelected = 0;

        $scope.setScrollOptions = function(num) {
            $scope.scrollWrap.scrollOptions.event = num === 0 ? 'tasksDoneScrolled' :
                num === 1 ? 'tasksCheckedScrolled' :
                    num === 2 ? 'tasksApprovedScrolled' : 'tasksCreatedScrolled';
        };

        $scope.scrollCallback = function(data) {
            console.log('asdasdasd');
        };
    }
);

app.controller('registrationCtrl', function ($scope, $routeParams, $http, $location, getIsLoggedIn, isImage, $mdToast,
                                             $animate, $timeout, educationStr, workStr, loggedUser) {
        $scope.reg = {};

        $scope.step = 1;

        if ($location.path() === '/registration/step2') {
            $http.get('/logged_user').success(function(user) {
                if (!user) return;
                $scope.step = 2;
                $scope.reg.birthday = new Date(user.birthday);
                $scope.reg.isImageRes = true;
                $scope.reg.imgSrcRes = user.avatar;
                $scope.reg.gender = user.gender;
                $scope.reg.city = user.city;
                $scope.reg.country = user.country;
                $scope.reg.education = JSON.parse(user.education);
                $scope.reg.educationStr = educationStr($scope.reg.education);
                $scope.reg.work = JSON.parse(user.work);
                $scope.reg.workStr = workStr($scope.reg.work);
            });
        }
        else {
            $scope.reg.gender = 'мужской';
            $scope.reg.education = [];
            $scope.reg.work = [];
        }

        var maxYear = (new Date()).getFullYear();
        $scope.range = [];
        for (var i = maxYear; i > 1929; i--) {
            $scope.range.push(i);
        }

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
        $scope.validateEmail = function () {
            return $scope.vRegex.test($scope.reg.email);
        };
        $scope.validatePasswords = function () {
            return $scope.reg.password === $scope.reg.rePassword;
        };

        $scope.exists = {nick: false, email: false, emailnotvalid: false};
        $scope.checkNick = function () {
            $http.post('/check_nick', {nick: $scope.reg.nick}).success(function (data) {
                $scope.exists.nick = data ? false : true;
            });
        };
        $scope.checkEmail = function () {
            $http.post('/check_email', {email: $scope.reg.email}).success(function (data) {
                $scope.exists.email = data ? false : true;
            });
        };

        $scope.$watch('reg.nick', function (newVal) {
            if (newVal) {
                $scope.checkNick();
            }
            else $scope.exists.nick = false;
        });

        $scope.$watch('reg.email', function (newVal) {
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

        $scope.showErrorImgToast = function () {
            $mdToast.show(
                $mdToast.simple()
                    .content('Не удалось загрузить фотографию...')
                    .position('bottom left')
                    .hideDelay(3000)
                    .parent(angular.element(document.querySelector('#toastElem')))
            );
        };

        $scope.reg.imgSrc = '';
        $scope.reg.imgCropRes = '';
        $scope.reg.isImageRes = false;
        $scope.loadImage = function () {
            isImage($scope.reg.imgSrc).then(function (result) {
                if (!result) {
                    $scope.showErrorImgToast();
                    return;
                }
                $scope.reg.isImageRes = result;
                $scope.reg.imgSrcRes = $scope.reg.imgSrc;
            });
        };

        $scope.handleFileSelect = function (element) {
            var file = element.files[0];
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function ($scope) {
                    $scope.reg.isImageRes = true;
                    console.log(evt.target.result);
                    $scope.reg.imgSrcRes = evt.target.result;
                });
            };
            reader.readAsDataURL(file);
        };

        $scope.selectImage = function () {
            angular.element(document.querySelector('#fileInput'))[0].click();
        };

        $scope.addEducation = function () {
            if (!$scope.reg.edName) return;
            var e = {school: {name: $scope.reg.edName}};
            if ($scope.reg.edConc) e.concentration = [{name: $scope.reg.edConc}];
            if ($scope.reg.edYear) e.year = {name: $scope.reg.edYear};

            $scope.reg.education.push(e);
            $scope.reg.educationStr = educationStr($scope.reg.education);
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
            $scope.reg.workStr = workStr($scope.reg.work);
            $scope.reg.woName = null;
            $scope.reg.woPosition = null;
            $scope.reg.woStartDate = null;
            $scope.reg.woEndDate = null;
        };

        $scope.removeEducation = function (index) {
            $scope.reg.education.splice(index, 1);
            $scope.reg.educationStr.splice(index, 1);
        };
        $scope.removeWork = function (index) {
            $scope.reg.work.splice(index, 1);
            $scope.reg.workStr.splice(index, 1);
        };

        $scope.goToStep3 = function () {
            $http.post('/register/step2', {
                avatar: $scope.reg.imgCropRes,
                birthday: $scope.reg.birthday,
                gender: $scope.reg.gender,
                city: $scope.reg.city,
                country: $scope.reg.country,
                education: JSON.stringify($scope.reg.education),
                work: JSON.stringify($scope.reg.work)
            }).success(function(data) {
                if (data) {
                    getIsLoggedIn(function(user) {
                        $http.get('db/skills').success(function(skills) {
                            $scope.skills = skills;

                            $scope.chips = {skillsTitles: [], skillsTitlesFiltered: [], selectedSkills: []};

                            $scope.skillsTitles = [];
                            for (var i in $scope.skills) {
                                $scope.chips.skillsTitles.push($scope.skills[i].title);
                            }

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
                                var found = false;
                                for (var i in $scope.chips.skillsTitles) {
                                    found = false;
                                    for (var j in newVal) {
                                        if (newVal[j] === $scope.chips.skillsTitles[i]) {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) $scope.chips.skillsTitlesFiltered.push($scope.chips.skillsTitles[i]);
                                }
                            });

                            $scope.done = function () {
                                if ($scope.chips.selectedSkills.length === 0) {
                                    $location.path('/users/' + user.id);
                                    return;
                                }
                                var dataNeeds = {needs: []};
                                for (var i in $scope.chips.selectedSkills) {
                                    for (var j in $scope.skills) {
                                        if ($scope.chips.selectedSkills[i] === $scope.skills[j].title) {
                                            dataNeeds.needs.push($scope.skills[j].id);
                                            break;
                                        }
                                    }
                                }
                                $http.post('/append_needs', dataNeeds).success(function () {
                                    $location.path('/users/' + user.id);
                                });
                            };

                            $scope.step = 3;
                        });
                    });
                }
            });
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

app.controller('restoreCtrl', function ($scope, $http, $mdDialog, $location) {
    $mdDialog.hide();
    $scope.restore = {};
    $scope.restore.emailErr = false;
    $scope.restore.codeErr = false;
    $scope.restore.checkErr = false;

    $scope.send = function(email) {
        $scope.checkEmail();

        if (!$scope.restore.emailErr) {
            $http.post('/restore', {email: email}).success(function (data) {
                $scope.restore.secretCode = data;
                console.log(data);
            });
        }
    };

    //TO DO: secretCode должен быть только на серваке. Перенести проверку на сервер.
    $scope.done = function () {
        if($scope.restore.code === $scope.restore.secretCode) {
            $scope.restore.changePass = true;
        }
        else {
            $scope.restore.codeErr = true;
        }
    };

    $scope.changePassword = function (password, rePassword) {
        if(password && rePassword && (password === rePassword)) {
            $http.post('/change_password', {email: $scope.restore.email, password: password}).success(function(data) {
                $location.path(data);
            })
        }
        else {
            $scope.restore.checkErr = true;
        }
    };

    $scope.getRestoreErr = function() {
        return $scope.restore;
    };

    $scope.checkEmail = function () {
        $http.post('/check_email', {email: $scope.restore.email}).success(function (data) {
            $scope.restore.emailErr = data ? true : false;
        });
    };

    $scope.goToMain = function () {
        $location.path('/main');
    };
});
