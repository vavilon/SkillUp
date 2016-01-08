app.controller('usersListCtrl', function ($scope, $http, $filter, $location, $rootScope, getObjByID, parseSkills, loadUsers, isLoggedIn) {
    if (!isLoggedIn()) { $location.path('/main'); return; }
    $rootScope.ajaxCall.promise.then(function () {
        $scope.username = "";
        $scope.filteredUsers = [];

        $http.get('db/users').success(function (data) {
            $scope.users = data;

            $scope.scrollWrap = {
                loadFunc: loadUsers,
                callback: $scope.scrollCallback,
                options: {offset: $scope.users.length}
            };

            $scope.lastExpandedUser = $scope.users[0];

            for (var i in $scope.users) {
                parseSkills($scope.users[i], true);
            }
        });

        $scope.exs = $rootScope.exs;

        $scope.findSkill = function (id) {
            return $scope.exs.skills[id];
        };

        $scope.expand = function (user) {
            if ($scope.lastExpandedUser !== user) $scope.lastExpandedUser.expanded = false;
            user.expanded = !user.expanded;
            $scope.lastExpandedUser = user;
        };

        $scope.$watch('username', function () {
            if ($scope.lastExpandedUser) $scope.lastExpandedUser.expanded = false;
        });

        $scope.scrollCallback = function (data) {
            for (var i in data) {
                parseSkills(data[i], true);
            }
            $scope.users = $scope.users.concat(data);
        };
    });
});

app.controller('profileCtrl', function ($scope, $routeParams, $http, getObjByID, educationObjToArr, workObjToArr, loadLoggedUser,
                                        loggedUser, parseSkills, loadTasks, loadUsers, $rootScope,
                                        setNotReceivable, isLoggedIn, $location, addEducation, removeEducation,
                                        addWork, removeWork) {
    if (!isLoggedIn()) { $location.path('/main'); return; }

    $scope.scrollWrap = $scope.scrollWrap || {
            loadFunc: loadTasks, callback: $scope.scrollCallback,
            scrollOptions: {percent: 95, event: 'tasksDoneScrolled'}
        };
    $scope.setScrollOptions = function (num) {
        $scope.scrollWrap.scrollOptions.event = num === 0 ? 'tasksDoneScrolled' :
            num === 1 ? 'tasksCheckedScrolled' :
                num === 2 ? 'tasksApprovedScrolled' : 'tasksCreatedScrolled';
    };

    $scope.scrollCallback = function (data) {
        console.log('asdasdasd');
    };

    $rootScope.ajaxCall.promise.then(function () {
        $scope.categoryNum = 0;
        $scope.tabSelected = 0;

        $scope.findSkill = function (id) {
            return $scope.exs.skills[id];
        };

        $scope.exs = $rootScope.exs;

        var dbUsersOptions = {id: $routeParams.user_id};

        $scope.loadProfile = function (data) {
            if (!data) $scope.user = loggedUser();
            else {
                parseSkills(data[0], true);
                $scope.user = data[0];
            }
            $scope.ownProfile = (loggedUser().id === $scope.user.id);

            if ($scope.user.education) {
                $scope.user.education = JSON.parse($scope.user.education);
                $scope.user.educationArr = educationObjToArr($scope.user.education);
            }
            if ($scope.user.work) {
                $scope.user.work = JSON.parse($scope.user.work);
                $scope.user.workArr = workObjToArr($scope.user.work);
            }

            $scope.info = {
                editing: {},
                birthday: new Date($scope.user.birthday),
                country: $scope.user.country,
                city: $scope.user.city,
                education: angular.copy($scope.user.education),
                educationArr: angular.copy($scope.user.educationArr),
                work: angular.copy($scope.user.work),
                workArr: angular.copy($scope.user.workArr)
            };

            $scope.editInfo = function(param) {
                if (param === 'birthday') $scope.info.birthday = new Date($scope.user.birthday);
                else if (param === 'location') {
                    $scope.info.country = $scope.user.country;
                    $scope.info.city = $scope.user.city;
                }
                else if (param === 'education') {
                    $scope.info.education = angular.copy($scope.user.education);
                    $scope.info.educationArr = angular.copy($scope.user.educationArr)
                }
                else if (param === 'work') {
                    $scope.info.work = angular.copy($scope.user.work);
                    $scope.info.workArr = angular.copy($scope.user.workArr)
                }
                $scope.info.editing[param] = true;
            };

            $scope.cancelEdit = function(param) {
                $scope.info.editing[param] = false;
            };

            $scope.updateProfile = function(param) {
                var updateData = {};
                if (param === 'birthday') updateData.birthday = $scope.info.birthday;
                else if (param === 'location') {
                    updateData.country = $scope.info.country;
                    updateData.city = $scope.info.city;
                }
                else if (param === 'education') {
                    updateData.education = JSON.stringify($scope.info.education);
                }
                else if (param === 'work') {
                    updateData.work = JSON.stringify($scope.info.work);
                }
                $http.post('/update_profile', updateData).success(function(res) {
                    if (!res) {
                    }
                    else {
                        if (param === 'birthday') $scope.user.birthday = $scope.info.birthday;
                        else if (param === 'location') {
                            $scope.user.country = $scope.info.country;
                            $scope.user.city = $scope.info.city;
                        }
                        else if (param === 'education') {
                            $scope.user.education = $scope.info.education;
                            $scope.user.educationArr = $scope.info.educationArr;
                        }
                        else if (param === 'work') {
                            $scope.user.work = $scope.info.work;
                            $scope.user.workArr = $scope.info.workArr;
                        }
                        $scope.info.editing[param] = false;
                    }
                });
            };

            var maxYear = (new Date()).getFullYear();
            $scope.range = [];
            for (var i = maxYear; i > 1929; i--) {
                $scope.range.push(i);
            }

            $scope.addEducation = function () { addEducation($scope.info); };

            $scope.removeEducation = function (index) { removeEducation($scope.info, index); };

            $scope.addWork = function () { addWork($scope.info); };

            $scope.removeWork = function (index) { removeWork($scope.info, index); };

            if ($scope.user.tasks_done) {
                var dbTasksDoneOptions = {ids: $scope.user.tasks_done};
                $http.post('/db/tasks', dbTasksDoneOptions).success(function (tasksDone) {
                    $scope.tasksDone = tasksDone;
                    if ($scope.ownProfile) for (var i in $scope.tasksDone) $scope.tasksDone[i].notReceivable = true;
                    else {
                        setNotReceivable($scope.tasksDone, loggedUser().tasks_created, true);
                        setNotReceivable($scope.tasksDone, loggedUser().tasks_done, true);
                    }
                    dbTasksDoneOptions.offset = $scope.tasksDone.length;

                    $scope.scrollWrap = {
                        loadFunc: loadTasks, callback: $scope.scrollCallback,
                        loadOptions: dbTasksDoneOptions, scrollOptions: {percent: 95, event: 'tasksDoneScrolled'}
                    };
                });
            }

            if ($scope.user.solutions_checked) {
                var dbSolutionsCheckedOptions = {ids: $scope.user.solutions_checked};
                $http.post('/db/solutions', dbSolutionsCheckedOptions).success(function (solutionsChecked) {
                    $scope.solutionsChecked = solutionsChecked;
                });
            }

            if ($scope.user.tasks_approved) {
                var dbTasksApprovedOptions = {ids: $scope.user.tasks_approved};
                $http.post('/db/tasks', dbTasksApprovedOptions).success(function (tasksApproved) {
                    $scope.tasksApproved = tasksApproved;
                    for (var i in $scope.tasksApproved) {
                        if (!$scope.tasksApproved[i].is_approved) {
                            $scope.tasksApproved[i].notReceivable = true;
                            continue;
                        }
                        if (loggedUser().tasks_created && loggedUser().tasks_created.indexOf($scope.tasksApproved[i].id) !== -1) {
                            $scope.tasksApproved[i].notReceivable = true;
                            continue;
                        }
                        if (loggedUser().tasks_done && loggedUser().tasks_done.indexOf($scope.tasksApproved[i].id) !== -1) {
                            $scope.tasksApproved[i].notReceivable = true;
                        }
                    }
                });
            }

            if ($scope.user.tasks_created) {
                var dbTasksCreatedOptions = {ids: $scope.user.tasks_created};
                $http.post('/db/tasks', dbTasksCreatedOptions).success(function (tasksCreated) {
                    $scope.tasksCreated = tasksCreated;
                    if (!$scope.ownProfile) {
                        setNotReceivable($scope.tasksCreated, loggedUser().tasks_done, true);
                    }
                    else for (var i in $scope.tasksCreated) $scope.tasksCreated[i].notReceivable = true;
                });
            }
        };

        if (!loggedUser()) return;
        if (loggedUser().id != $routeParams.user_id)
            $http.post('/db/users', dbUsersOptions).success($scope.loadProfile);
        else $scope.loadProfile();
    });
});

app.controller('registrationCtrl', function ($scope, $routeParams, $http, $location, loadLoggedUser, isImage, $mdToast,
                                             $animate, $timeout, educationObjToArr, workObjToArr, addEducation, removeEducation,
                                             addWork, removeWork) {
    $scope.reg = {};

    $scope.step = 1;

    if ($location.path() === '/registration/step2') {
        loadLoggedUser(function(user) {
            if (!user) return;
            $scope.step = 2;
            if (user.birthday) $scope.reg.birthday = new Date(user.birthday);
            if (user.avatar) {
                $scope.reg.isImageRes = true;
                $scope.reg.imgSrcRes = user.avatar;
            }
            $scope.reg.gender = user.gender || 'мужской';
            if (user.city) $scope.reg.city = user.city;
            if (user.country) $scope.reg.country = user.country;
            $scope.reg.education = [];
            if (user.education) {
                $scope.reg.education = JSON.parse(user.education);
                $scope.reg.educationArr = educationObjToArr($scope.reg.education);
            }
            $scope.reg.work = [];
            if (user.work) {
                $scope.reg.work = JSON.parse(user.work);
                $scope.reg.workArr = workObjToArr($scope.reg.work);
            }
        });
    }

    var maxYear = (new Date()).getFullYear();
    $scope.range = [];
    for (var i = maxYear; i > 1929; i--) {
        $scope.range.push(i);
    }

    $scope.reg.nick = $routeParams.nick === '0' ? '' : $routeParams.nick;
    $scope.reg.email = $routeParams.email === '0' ? '' : $routeParams.email;
    $scope.reg.password = $routeParams.password === '0' ? '' : $routeParams.password;
    $scope.passwordStrong = false;

    $scope.showSuccessToast = function () {
        $mdToast.show(
            $mdToast.simple()
                .content('Вы успешно зарегистрированы!')
                .position('top left')
                .hideDelay(3000)
        );
    };

    $scope.showErrorToast = function (msg) {
        $mdToast.show(
            $mdToast.simple()
                .content(msg)
                .position('top left')
                .hideDelay(3000)
        );
    };

    $scope.passwordsEqual = function () {
        var err = {notequal: false};
        if (!$scope.reg.password) return err;
        if (!$scope.reg.rePassword) return err;
        if ($scope.getPasswordStrong().notstrong) return err;
        err.notequal = $scope.reg.password !== $scope.reg.rePassword;
        return err;
    };

    $scope.getPasswordStrong = function () {
        var err = {notstrong: false};
        if (!$scope.reg.password) return err;
        err.notstrong = !$scope.passwordStrong;
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

    //Проверка сложности пароля от 1 до 4, если больше 1 - норм
    $scope.$watch('reg.password', function(newVal) {
        if (newVal) {
            $scope.checkResult = zxcvbn(newVal, [$scope.reg.name, $scope.reg.nick, $scope.reg.email]);
            $scope.passwordStrong = $scope.checkResult.score > 1;
        }
    });

    $scope.checkRegInput = function () {
        return $scope.validateEmail() && $scope.validatePasswords() && !$scope.exists.nick && !$scope.exists.email && $scope.passwordStrong;
    };

    $scope.register = function () {
        if ($scope.checkRegInput()) {
            $http.post('/register', {
                nick: $scope.reg.nick,
                name: $scope.reg.name,
                email: $scope.reg.email,
                password: $scope.reg.password
            }).success(function () {
                $scope.regDataSent = true;
            }).error(function (err) {
                $scope.showErrorToast(err.message || 'Введены некорректные данные!');
            });
        } else if($scope.checkResult.feedback.warning) {
            $scope.showErrorToast($scope.checkResult.feedback.warning);
        } else {
            $scope.showErrorToast('Введены некорректные данные!');
        }
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

    $scope.addEducation = function() { addEducation($scope.reg); };

    $scope.removeEducation = function (index) { removeEducation($scope.reg, index); };

    $scope.addWork = function () { addWork($scope.reg); };

    $scope.removeWork = function (index) { removeWork($scope.reg, index); };

    $scope.goToStep3 = function () {
        $http.post('/update_profile', {
            avatar: $scope.reg.imgCropRes,
            birthday: $scope.reg.birthday,
            gender: $scope.reg.gender,
            city: $scope.reg.city,
            country: $scope.reg.country,
            education: JSON.stringify($scope.reg.education),
            work: JSON.stringify($scope.reg.work)
        }).success(function(data) {
            if (data) {
                loadLoggedUser(function(user) {
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
                                        dataNeeds.needs.push($scope.skills[j].skill_id);
                                        break;
                                    }
                                }
                            }
                            $http.post('/needs', dataNeeds).success(function () {
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
});

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

app.controller('adminCtrl', function ($scope, $http, $rootScope, $mdDialog, getColumns, getRowsOnPage) {
    //По нажатию на заголовок боковой панели показывает статистику
    $scope.showStatistic = true;
    $scope.statistic = function () {
        $scope.showStatistic = true;
    };

    $rootScope.ajaxCall.promise.then(function () {
        //Последняя развернутая таблица инициализируется нуллом
        $scope.lastExpandedTable = null;

        $scope.database = {
            name: 'skillup', tables: [
                {name: 'skills', rows: null, columnNames: null},
                {name: 'tasks', rows: null, columnNames: null},
                {name: 'users', rows: null, columnNames: null},
                {name: 'solutions', rows: null, columnNames: null}
            ]
        };

        //Функция для загрузки данных при разворачивании списка колонок
        $scope.expand = function (table) {
            $scope.pageNumber = 0;

            //rowsOnScreen - количество строк таблицы, которые поместяться в видимой области
            if (document.getElementById('tables').offsetHeight >= 290) {
                $scope.rowsOnScreen = Math.floor((document.getElementById('tables').offsetHeight - 192) / 48);
            } else {
                $scope.rowsOnScreen = 8;
            }

            //Поиск по выбраной колонке
            $scope.filter = {};
            $scope.filter.query = "";
            //Не работает в текущей версии материала (9.4)
            //$scope.filter.resetQuery = function () {
            //    this.query = "";
            //};
            $scope.filter.byColumnName = "id";

            //Выбраные строки в таблице
            $scope.selection.indexes = [];
            $scope.selection.allSelected = false;

            //Скрывает статистику, чтобы показать таблицу
            $scope.showStatistic = false;

            //Закрытие прошлой развернутой таблицы и сохранение текущей
            if ($scope.lastExpandedTable && $scope.lastExpandedTable !== table) {
                $scope.lastExpandedTable.expanded = false;
            }
            table.expanded = !table.expanded;
            $scope.lastExpandedTable = table;

            //Первая буква имени в верхнем регистре
            $scope.tableName = $scope.lastExpandedTable.name.slice(0, 1).toUpperCase() + $scope.lastExpandedTable.name.slice(1);
            //Кол-во строк на странице зависит от размера экрана
            $scope.lastExpandedTable.rowsPerPage = $scope.rowsOnScreen;
            //Переменная связаная с полем выбора кол-ва строк на странице
            $scope.footer = {};
            $scope.footer.rowsPerPage = $scope.lastExpandedTable.rowsPerPage;

            if ($scope.lastExpandedTable.expanded && !$scope.lastExpandedTable.columnNames) {
                //Загрузка названий (типов и тд) колонок развернутой таблицы
                getColumns($scope.lastExpandedTable);
                //Загрузка строк развернутой таблицы
                if (!$scope.lastExpandedTable.rows) {
                    $http.post('/db/' + $scope.lastExpandedTable.name, {}).success(function (data) {
                        $scope.lastExpandedTable.rows = data;

                        //Получение количества строк в таблице
                        $http.get('/db/' + $scope.lastExpandedTable.name + '/rows_count').success(function (count) {
                            $scope.lastExpandedTable.rowsCount = count;
                            if (count < $scope.rowsOnScreen) $scope.lastExpandedTable.rowsPerPage = count;

                            //Получаем строки отображаемые на текущей странице
                            $scope.rowsOnPage = getRowsOnPage($scope.lastExpandedTable.rows,
                                $scope.lastExpandedTable.rowsPerPage,
                                $scope.pageNumber,
                                $scope.lastExpandedTable.rowsCount);

                            //Сохраняем исходную таблицу
                            //$scope.savedTable = angular.copy($scope.lastExpandedTable);
                        }).error(function (error) {
                            console.log(error);
                        });
                    }).error(function (error) {
                        console.log(error);
                    });
                }
            } else if ($scope.lastExpandedTable.rowsCount < $scope.rowsOnScreen)
                $scope.footer.rowsPerPage = $scope.lastExpandedTable.rowsCount;
        };

        //Показывает диалог в котором отображаются свойства колонки (columnName) в таблице (table)
        $scope.columnInfo = function (table, columnName, event) {
            $mdDialog.show({
                parent: angular.element(document.body),
                targetEvent: event,
                templateUrl: '/front/templates/propertyDialog.html',
                locals: {
                    text: $scope.text,
                    title: $scope.title
                },
                controller: DialogController
            });

            //Контроллер диалога
            function DialogController($scope, $mdDialog) {
                $scope.ok = function() {
                    $mdDialog.hide();
                };

                //Построение текста который отображается в диалоге
                $scope.title = columnName.toUpperCase();
                $scope.text = '';
                for (var property in table.columns[columnName]) {
                    if (table.columns[columnName].hasOwnProperty(property)) {
                        $scope.text += property.toUpperCase() + ': ' + table.columns[columnName][property] + '\n';
                    }
                }
            }
        };

        //Функция сортировки, при нажатии на название колонки таблицы
        $scope.sortColumn = function (table, columnName) {
            table.columnClicked = table.columnClicked || {};
            //Проверка, если последняя сортированая колонка не равна текущей - удаляем ее
            if (table.columnClicked[columnName] === undefined){
                table.columnClicked[columnName] = 0;
                if (Object.keys(table.columnClicked).length > 1) table.columnClicked = {};
            }

            //Сортировка колонки в зависимости от значения переменной columnClicked[columnName]: 1, -1, 0; соответственно прямая, обратная или исходная
            if (!table.columnClicked[columnName]) {
                table.columnClicked[columnName] = 1;
                $scope.rowsOnPage.sort(function (a, b) {
                    if (a[columnName] > b[columnName]) return 1;
                    if (a[columnName] < b[columnName]) return -1;
                    return 0;
                });
            } else if (table.columnClicked[columnName] === 1) {
                table.columnClicked[columnName] = -1;
                $scope.rowsOnPage = $scope.rowsOnPage.reverse();
            } else {
                table.columnClicked[columnName] = 0;
                $scope.rowsOnPage = getRowsOnPage(table.rows, table.rowsPerPage, $scope.pageNumber, table.rowsCount);
            }
        };

        //Пометить строки таблицы на текущей странице выбраными или снять метки, при нажатии на checkbox в заголовке таблицы
        $scope.selectAllRows = function () {
            if (!$scope.selection.allSelected) {
                for (var obj in $scope.rowsOnPage) {
                    if ($scope.rowsOnPage.hasOwnProperty(obj))
                        $scope.selection.indexes[$scope.rowsOnPage[obj]['id']] = true;
                }
            }
            else {
                $scope.selection.indexes = [];
            }
        };

        //Переход на страницу влево
        $scope.leftPage = function () {
            $scope.pageNumber -= 1;
            $scope.reset();
        };

        //Переход на страницу вправо и подгрузка данных, если необходимо
        $scope.rightPage = function () {
            $scope.pageNumber += 1;

            //Подгрузка
            if ($scope.lastExpandedTable.rows.length <= $scope.lastExpandedTable.rowsPerPage * ($scope.pageNumber + 1)) {
                $http.post('/db/' + $scope.lastExpandedTable.name,
                    {limit: $scope.lastExpandedTable.rowsPerPage, offset: $scope.lastExpandedTable.rows.length}
                ).success(function (data) {
                    $scope.lastExpandedTable.rows = $scope.lastExpandedTable.rows.concat(data);
                    //Сохраняем исходную таблицу
                    //$scope.savedTable = angular.copy($scope.lastExpandedTable);

                    $scope.reset();
                }).error(function (error) {
                    console.log(error);
                });
            } else {
                $scope.reset();
            }
        };

        //Обнуляем выделение и обновляем строки отображаемые на текущей странице при смене страницы
        $scope.reset = function () {
            $scope.selection.indexes = [];
            $scope.selection.allSelected = false;

            //Получаем строки отображаемые на текущей странице
            $scope.rowsOnPage = getRowsOnPage($scope.lastExpandedTable.rows,
                $scope.lastExpandedTable.rowsPerPage,
                $scope.pageNumber,
                $scope.lastExpandedTable.rowsCount);
        };

        //Если изменяется кол-во строк на странице надо пересчитать номер страницы и догрузить данные при надобности
        $scope.$watch('footer.rowsPerPage', function (newValue) {
            if($scope.lastExpandedTable && $scope.lastExpandedTable.rows) {
                $scope.pageNumber = 0;
                $scope.lastExpandedTable.rowsPerPage = newValue;

                //Подгрузка
                if ($scope.lastExpandedTable.rows.length <= $scope.lastExpandedTable.rowsPerPage) {
                    $http.post('/db/' + $scope.lastExpandedTable.name,
                        {limit: $scope.lastExpandedTable.rowsPerPage, offset: $scope.lastExpandedTable.rows.length}
                    ).success(function (data) {
                        $scope.lastExpandedTable.rows = $scope.lastExpandedTable.rows.concat(data);
                        //Сохраняем исходную таблицу
                        //$scope.savedTable = angular.copy($scope.lastExpandedTable);

                        //Получаем строки отображаемые на текущей странице
                        $scope.rowsOnPage = getRowsOnPage($scope.lastExpandedTable.rows,
                            $scope.lastExpandedTable.rowsPerPage,
                            $scope.pageNumber,
                            $scope.lastExpandedTable.rowsCount);
                    }).error(function (error) {
                        console.log(error);
                    });
                } else {
                    //Получаем строки отображаемые на текущей странице
                    $scope.rowsOnPage = getRowsOnPage($scope.lastExpandedTable.rows,
                        $scope.lastExpandedTable.rowsPerPage,
                        $scope.pageNumber,
                        $scope.lastExpandedTable.rowsCount);
                }
            }
        });

        $scope.$watchCollection('selection.indexes', function (newValue) {
            $scope.selection = $scope.selection || {};
            $scope.selection.count = 0;
            if (newValue && newValue.length) {
                for (var obj in newValue) {
                    if (newValue.hasOwnProperty(obj))
                        if (newValue[obj]) {
                            $scope.selection.selected = true;
                            $scope.selection.count += 1;
                        }
                }
                $scope.selection.selected = !!$scope.selection.count;
            } else {
                $scope.selection.selected = false;
            }
        });
    });
});
