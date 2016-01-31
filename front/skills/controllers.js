/**
 *
 * @param skills    Объект, считанный из skills.json
 * @returns {{}|*}  Объект-обертка, содержащий свойства:
 *                      leaves      (array)     спосок ссылок на все листья
 *                      skills      (object)   объект, содержащий все скиллы, как свойства
 *                      root        (object)   ссылка на скилл "Абсолютные знания"
 *                      log()       (function)  выводит в консоль все свойства объекта (для дебага)
 *                  Свойства скилла:
 *                      title       (string)  название скилла
 *                      parents     (array)   список ссылок на родителей
 *                      allParents  (array)   список ссылок на всех родителей вплоть до root
 *                      children    (array)   список ссылок на детей
 *                      allChildren (array)   список ссылок на всех детей вплоть до листьев
 *                      is_leaf      (bool)    является ли листком (может отсутствовать)
 *                      leaves      (array)   список ссылок на листья скилла (только собственные)
 *                      allLeaves   (array)   список ссылок на все листья скилла (рекурсивно по детям)
 *                      id          (string)  id скилла
 *
 */
app.factory('extendedSkills', function () {

    function arrToObj(skillArr) {
        skillArr = angular.copy(skillArr);
        var res = {};
        for (var i = 0; i < skillArr.length; i++) {
            res[skillArr[i].id] = skillArr[i];
            delete res[skillArr[i].id].id;
        }
        return res;
    }

    return function (skills) {
        if (!skills) return;
        skills = arrToObj(skills);
        this.leaves = []; //хранит ССЫЛКИ (не id) на все листья
        this.skills = {}; //объект, в котором свойствами являются скиллы

        for (var id in skills) {
            //копируем имеющиеся свойства
            this.skills[id] = this.skills[id] || {}; //проверка нужна, потому что дальше объекты могут создаваться
            this.skills[id].title = skills[id].title;
            this.skills[id].parents = []; //хранит ССЫЛКИ (не id) на родителей
            this.skills[id].leaves = this.skills[id].leaves || [];
            this.skills[id].allChildren = [];
            this.skills[id].allParents = [];
            this.skills[id].allLeaves = [];
            this.skills[id].id = id;
            this.skills[id].exp = skills[id].exp;
            this.skills[id].is_leaf = skills[id].is_leaf;

            if (skills[id].parents.length && skills[id].parents[0] == null) skills[id].parents = [];
            for (var i = 0; i < skills[id].parents.length; i++) {
                this.skills[skills[id].parents[i]] = this.skills[skills[id].parents[i]] || {};
                if (!_.includes(this.skills[id].parents, this.skills[skills[id].parents[i]]))
                    this.skills[id].parents.push(this.skills[skills[id].parents[i]]);
            }

            for (i = 0; i < this.skills[id].parents.length; i++) {
                this.skills[id].parents[i].leaves = this.skills[id].parents[i].leaves || [];
                if (skills[id].is_leaf)
                    if (!_.includes(this.skills[id].parents[i].leaves, this.skills[id]))
                        this.skills[id].parents[i].leaves.push(this.skills[id]);
            }
            if (skills[id].is_leaf) {
                this.skills[id].is_leaf = skills[id].is_leaf;
                this.leaves.push(this.skills[id]);
            }

            //создаем массив ССЫЛОК (не id) на детей
            this.skills[id].children = this.skills[id].children || []; //проверка нужна, чтобы children сохранялись
            for (i = 0; i < this.skills[id].parents.length; i++) {
                this.skills[id].parents[i].children = this.skills[id].parents[i].children || [];
                if (!_.includes(this.skills[id].parents[i].children, this.skills[id]))
                    this.skills[id].parents[i].children.push(this.skills[id]);
            }
        }

        //рекурсия для добавления всех детей вплоть до листьев и всех листьев
        function addAllChildrenRec(to, from) {
            for (var i = 0; i < from.children.length; i++)
                if (!_.includes(to.allChildren, from.children[i]))
                    to.allChildren.push(from.children[i]);

            for (i = 0; i < from.leaves.length; i++)
                if (!_.includes(to.allLeaves, from.leaves[i]))
                    to.allLeaves.push(from.leaves[i]);

            for (var chid in from.children) {
                addAllChildrenRec(to, from.children[chid]);
            }
        }

        //рекурсия для добавления всех родителей вплоть до корня
        function addAllParentsRec(to, from) {
            for (var i = 0; i < from.parents.length; i++)
                if (!_.includes(to.allParents, from.parents[i]))
                    to.allParents.push(from.parents[i]);

            for (var pid in from.parents) {
                addAllParentsRec(to, from.parents[pid]);
            }
        }

        //добавление ссылок на всех детей и всех родителей
        for (id in this.skills) {
            addAllChildrenRec(this.skills[id], this.skills[id]);
            addAllParentsRec(this.skills[id], this.skills[id]);
        }

        //для дебага
        this.log = function () {
            for (var prop in this) console.log(this[prop]);
        };

        this.root = this.skills['38'];
        //this.skills['root'] = this.root;
        this.root.level = 0;
        this.maxLevel = 0;

        function calculateLevels(skill) {
            for (var i in skill.children) {
                if (!skill.children[i].level || skill.children[i].level > skill.level + 1)
                    skill.children[i].level = skill.level + 1;
                calculateLevels(skill.children[i]);
            }
        }

        calculateLevels(this.root);

        for (var i in this.skills) {
            if (this.skills[i].level > this.maxLevel) this.maxLevel = this.skills[i].level;
        }

        function calculateReverseLevels(skill) {
            for (var i in skill.parents) {
                if (!skill.parents[i].reverseLevel || skill.parents[i].reverseLevel < skill.reverseLevel + 1)
                    skill.parents[i].reverseLevel = skill.reverseLevel + 1;
                calculateReverseLevels(skill.parents[i]);
            }
        }

        for (var i in this.skills) {
            if (this.skills[i].children.length == 0) {
                this.skills[i].reverseLevel = 0;
                calculateReverseLevels(this.skills[i]);
            }
        }


    };
});


app.controller('skillsCtrl', function ($scope, $http, $filter, $rootScope, $location, isLoggedIn, loadLoggedUser,
                                       appendProgressToExs, $timeout, editNeed, $mdDialog) {
    $rootScope.ajaxCall.promise.then(function () {
        if (!isLoggedIn()) { $location.path('/main'); return; }

        $rootScope.pageTitle = 'Умения';
        $rootScope.navtabs = {};//TODO: забиндить какие-нибудь табсы

        //Определяеться в каком виде выводятся скиллы (графа или дерева), используется в md-tooltip
        //Не испавлять на 'граф'
        $scope.viewLike = 'дерева';
        $scope.skillsLoadCounter = 0;

        $scope.currentSkill = $rootScope.exs.root;
        $scope.skills = $rootScope.exs.skills;
        //Объект в котором сохраняются id скиллов, которые надо добавить в needs
        $scope.dataNeeds = {needs: []};
        //Объект для поиска скилла по названию
        $scope.query = {};

        $scope.isOpened = false;

        $scope.openAddingDialog = function (ev) {
            dialogFactory(ev, '/dist/skills/addingDialog.html', {dialog: 'add'});
        };

        $scope.openDeletingDialog = function (ev) {
            dialogFactory(ev, '/dist/skills/deletingDialog.html', {dialog: 'delete'});
        };

        $scope.openUpdatingDialog = function (ev) {
            dialogFactory(ev, '/dist/skills/updatingDialog.html', {dialog: 'update'});
        };

        function dialogFactory(event, templateUrl, locals) {
            $mdDialog.show({
                controller: DialogController,
                templateUrl: templateUrl,
                parent: angular.element(document.body),
                targetEvent: event,
                autoWrap: false,
                clickOutsideToClose: true,
                locals: locals,
                bindToController: false,
                onRemoving: function () {
                    $rootScope.ajaxCall.promise.then(function () {
                        $scope.skills = $rootScope.exs.skills;
                        $scope.currentSkill = $scope.skills[$scope.currentSkill.id];
                    })
                }
            });
        }

        function DialogController($scope, $mdDialog, $mdToast, $http, $rootScope, $q, updateSkills, dialog) {
            $rootScope.ajaxCall.promise.then(function () {
                ($scope.init = function() {
                    $scope.allChildren = $rootScope.exs.root.allChildren;
                    $scope.allParents = [$rootScope.exs.root].concat($scope.allChildren);
                    $scope.skills = $rootScope.exs.skills;

                    $scope.chips = {};
                    $scope.chips.allChildrenNames = [];
                    for (var index in $scope.allChildren) {
                        $scope.chips.allChildrenNames.push({
                            id: $scope.allChildren[index].id,
                            title: $scope.allChildren[index].title
                        });
                    }
                    $scope.chips.allParentsNames = [{
                        id: $rootScope.exs.root.id,
                        title: $rootScope.exs.root.title
                    }].concat($scope.chips.allChildrenNames);
                })();

                if (dialog === 'add' || dialog === 'update') {
                    $scope.adding = {};
                    $scope.chips.selectedParents = [];
                    $scope.chips.selectedParent = null;
                    $scope.chips.searchParentTitle = '';

                    $scope.chips.selectedChildren = [];
                    $scope.chips.selectedChild = null;
                    $scope.chips.searchChildTitle = '';

                    function existFilter(title) {
                        return function checkForExist(skill) {
                            return angular.lowercase(skill.title) === angular.lowercase(title);
                        };
                    }
                }

                if (dialog === 'delete' || dialog === 'update') {
                    $scope.chips.selectedSkillsForDeleting = [];
                    $scope.chips.selectedSkill = null;
                    $scope.chips.searchSkillTitle = '';
                }

                if (dialog === 'update') {
                    $scope.updated = {};

                    $scope.selectedItemChanged = function (id) {
                        if (id) {
                            for (var index in $scope.skills[id].parents) {
                                $scope.chips.selectedParents
                                    .push({
                                        id: $scope.skills[id].parents[index].id,
                                        title: $scope.skills[id].parents[index].title
                                    });
                            }
                            for (var index in $scope.skills[id].children) {
                                $scope.chips.selectedChildren
                                    .push({
                                        id: $scope.skills[id].children[index].id,
                                        title: $scope.skills[id].children[index].title
                                    });
                            }
                            $scope.updated.title = $scope.chips.selectedSkill.title;
                        } else {
                            $scope.chips.selectedParents = [];
                            $scope.chips.selectedChildren = [];
                            $scope.updated.title = '';
                        }
                    };
                }

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };

                $scope.querySearch = function (query, array) {
                    return query ? array.filter(createFilterFor(query)) : [];
                };
                /**
                 * Create filter function for a query string
                 */
                function createFilterFor(query) {
                    return function filterFn(skill) {
                        if ($scope.chips.selectedSkill && skill.id == $scope.chips.selectedSkill.id) return false;
                        return angular.lowercase(skill.title).indexOf(angular.lowercase(query)) !== -1;
                    };
                }

                $scope.confirm = function () {
                    if (dialog === 'add' && $scope.adding.title) {
                        if (!!$scope.allParents.filter(existFilter($scope.adding.title)).length) {
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('Умение с таким именем уже существует')
                                    .hideDelay(2000)
                            );
                            return;
                        }

                        if ($scope.chips.selectedChildren.length) {
                            for (var index in $scope.chips.selectedParents) {
                                var title = $scope.chips.selectedParents[index].title;
                                if ($scope.chips.selectedChildren.filter(existFilter(title)).length) {
                                    $mdToast.show(
                                        $mdToast.simple()
                                            .textContent('В родительских и дочерних умениях не должно быть совпадений')
                                            .hideDelay(2000)
                                    );
                                    return;
                                }
                            }
                        }

                        var newSkill = {
                            title: $scope.adding.title,
                            parents: $scope.chips.selectedParents.length ? $scope.chips.selectedParents : [{
                                id: $rootScope.exs.root.id,
                                title: $rootScope.exs.root.title
                            }],
                            children: $scope.chips.selectedChildren
                        };

                        $http.post('/add_skill', {skill: newSkill}).success(function (data) {
                            if (data == 'ok') {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('Умение успешно добавлено')
                                        .hideDelay(2000)
                                );
                                //обнуляем переменные
                                $scope.adding.title = '';
                                $scope.chips.selectedParents = [];
                                $scope.chips.selectedParent = null;
                                $scope.chips.searchParentTitle = '';
                                $scope.chips.selectedChildren = [];
                                $scope.chips.selectedChild = null;
                                $scope.chips.searchChildTitle = '';
                                updateExs();
                            } else {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('При добавлении умения произошла ошибка')
                                        .hideDelay(2000)
                                );
                            }
                        });
                    }

                    if (dialog === 'update' && $scope.chips.selectedSkill) {
                        var skill = $scope.skills[$scope.chips.selectedSkill.id];

                        //Проверка были ли внесены изменения
                        if ($scope.updated.title === $scope.chips.selectedSkill.title) {
                            if (skill.parents.length == $scope.chips.selectedParents.length) {
                                var temp;
                                for (var obj in skill.parents) {
                                    temp = false;
                                    for (var obj1 in $scope.chips.selectedParents) {
                                        if (skill.parents[obj].id == $scope.chips.selectedParents[obj1].id) temp = true;
                                    }
                                    if (!temp) break;
                                }
                                if (temp && skill.children.length == $scope.chips.selectedChildren.length) {
                                    for (var obj in skill.children) {
                                        temp = false;
                                        for (var obj1 in $scope.chips.selectedChildren) {
                                            if (skill.children[obj].id == $scope.chips.selectedChildren[obj1].id) temp = true;
                                        }
                                        if (!temp) break;
                                    }
                                    if (temp) {
                                        $mdToast.show(
                                            $mdToast.simple()
                                                .textContent('Нет изменений для сохранения')
                                                .hideDelay(2000)
                                        );
                                        return;
                                    }
                                }
                            }
                        } else {
                            if (!$scope.updated.title) return;
                            else if (!!$scope.allParents.filter(existFilter($scope.updated.title)).length) {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('Умение с таким именем уже существует')
                                        .hideDelay(2000)
                                );
                                return;
                            }
                        }

                        //Проверка изменилось ли что-нибудь в родительских умениях
                        var parentsForInsert, id = $scope.chips.selectedSkill.id;
                        if ($scope.chips.selectedParents.length == $scope.skills[id].parents.length) {
                            for (var index in $scope.chips.selectedParents) {
                                var pTitle = $scope.chips.selectedParents[index].title;
                                if (!$scope.skills[id].parents.filter(existFilter(pTitle)).length) {
                                    parentsForInsert = [];
                                    console.log(parentsForInsert);
                                }
                            }
                            if (!parentsForInsert) parentsForInsert = null; //null - значит, что ничего не изменилось
                        }

                        if (parentsForInsert !== null)
                            parentsForInsert = $scope.chips.selectedParents.length
                                ? $scope.chips.selectedParents.map(function (el) {
                                return {skill_id: $scope.chips.selectedSkill.id, parent_id: el.id};
                            })
                                //Если родительские умения не были выбраны, то родителем будет корневое умение
                                : [{skill_id: $scope.chips.selectedSkill.id, parent_id: $rootScope.exs.root.id}];

                        //Проверка изменилось ли что-нибудь в дочерних умениях
                        var childrenForInsert;
                        if ($scope.chips.selectedChildren.length == $scope.skills[id].children.length) {
                            for (var index in $scope.chips.selectedChildren) {
                                var cTitle = $scope.chips.selectedChildren[index].title;
                                if (!$scope.skills[id].children.filter(existFilter(cTitle)).length) {
                                    childrenForInsert = [];
                                }
                            }
                            if (!childrenForInsert) childrenForInsert = null; //null - значит, что ничего не изменилось
                        }

                        if (childrenForInsert !== null)
                            childrenForInsert = $scope.chips.selectedChildren.map(function (el) {
                                return {skill_id: el.id, parent_id: $scope.chips.selectedSkill.id};
                            });

                        var updatedSkill = {
                            id: $scope.chips.selectedSkill.id,
                            title: $scope.updated.title,
                            parents: parentsForInsert,
                            children: childrenForInsert
                        };

                        $http.post('/update_skill', {skill: updatedSkill}).success(function (data) {
                            if (data == 'ok') {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('Умения успешно обновлены')
                                        .hideDelay(2000)
                                );
                                //обнуляем переменные
                                $scope.chips.selectedSkill = null;
                                $scope.chips.searchSkillTitle = '';
                                updateExs();
                            } else {
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent('При обновлении умений произошла ошибка')
                                        .hideDelay(2000)
                                );
                            }
                        });
                    }

                    if (dialog === 'delete' && $scope.chips.selectedSkillsForDeleting.length) {
                        var ids = $scope.chips.selectedSkillsForDeleting.map(function (el) {
                            return el.id;
                        });

                        $http.post('/delete_skill', {skills: ids})
                            .success(function (data) {
                                if (data == 'ok') {
                                    $mdToast.show(
                                        $mdToast.simple()
                                            .textContent('Умения успешно удалены')
                                            .hideDelay(2000)
                                    );
                                    updateExs();
                                    $mdDialog.hide();
                                } else {
                                    $mdToast.show(
                                        $mdToast.simple()
                                            .textContent('При удалении умений произошла ошибка')
                                            .hideDelay(2000)
                                    );
                                }
                            });
                    } else if (dialog === 'delete') {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Вы не выбрали умений для удаления')
                                .hideDelay(2000)
                        );
                    }
                };

                function updateExs() {
                    $rootScope.ajaxCall = $q.defer();
                    loadLoggedUser(function(user) {
                        if (user) {
                            $http.get('db/skills').success(function (data) {
                                if (data) {
                                    updateSkills(data);
                                }
                                $rootScope.ajaxCall.resolve();
                                $scope.init();
                            });
                        } else $rootScope.ajaxCall.resolve();
                    });
                }
            });
        }

        //Функция для поиска совпадений в названиях скиллов с введенным текстом
        //Возвращает массив подходящих скиллов
        $scope.query.search = function (text) {
            var lowercaseQuery = angular.lowercase(text);
            var filteredSkills = [];
            for (var id in $scope.skills) {
                if ($scope.skills[id].title.toLowerCase().indexOf(lowercaseQuery) !== -1) {
                    filteredSkills.push($scope.skills[id]);
                }
            }
            return filteredSkills;
        };

        $scope.expandParents = function (skill) {
            if (skill.parents.length) skill.parents[0].expanded = true;
            else return;
            $scope.expandParents(skill.parents[0]);
        };

        //Делает выбраный в autocomplete скилл текущим в виде графа или прокручивает до скила в виде дерева
        $scope.query.selectedItemChanged = function (skill) {
            if (skill)
                if ($scope.viewLike !== 'графа') {
                    $scope.currentSkill = skill;
                } else {
                    $scope.collapseTree();
                    $scope.expandAll.disabled = false;
                    $scope.expandParents($scope.skills[skill.id]);
                    $scope.highlightedSkillID = skill.id;
                }
        };

        //Делает выбраный скилл текущим (по нажатию на скилл)
        $scope.setToCurrent = function (skill) {
            if ($scope.addClicked) $scope.addClicked = false;
            else $scope.currentSkill = skill;
        };

        //Чтобы при нажатии на плюс или крест не устанавливался currentSkill
        $scope.addClicked = false;

        //Добавляе нидс
        $scope.addNeed = function (id) {
            $scope.addClicked = true;
            $scope.editNeed(id, false);
        };

        //Убираем нидс
        $scope.removeNeed = function (id) {
            $scope.addClicked = true;
            $scope.editNeed(id, true);
        };

        //Добавить или убрать скилл из нидсов текущего юзера
        $scope.editNeed = editNeed;

        $scope.expandAll = {};
        $scope.expandAll.visible = false;
        $scope.expandAll.disabled = true;

        $scope.highlight = {};
        $scope.highlight.skills = true;
        $scope.highlight.needs = true;

        $rootScope.exs.root.expanded = true;

        $scope.setExpandedAllDisabled = function () {
            if (!$rootScope.exs.root.expanded) {
                $scope.expandAll.disabled = true;
                return;
            }
            for (var skill in $rootScope.exs.root.children) {
                if ($rootScope.exs.root.children[skill].expanded) {
                    $scope.expandAll.disabled = false;
                    return;
                }
            }
            $scope.expandAll.disabled = true;
        };

        $scope.collapseTree = function () {
            for (var skill in $scope.skills) {
                $scope.skills[skill].expanded = false;
            }
            $rootScope.exs.root.expanded = true;
            $scope.expandAll.disabled = true;
        };

        $scope.expand = function (skill) {
            skill.expanded = !skill.expanded;
            if (!skill.expanded) $scope.setExpandedAllDisabled();
            else $scope.expandAll.disabled = false;
        };

        $scope.getSkillType = function (skill) {
            if (skill.need) return $scope.highlight.needs ? 'need' : null;
            if (skill.count) return $scope.highlight.skills ? 'skill' : null;
        };

        $scope.changeView = function () {
            if($scope.viewLike === 'графа') $scope.viewLike = 'дерева';
            else $scope.viewLike = 'графа';
            $scope.expandAll.visible = !$scope.expandAll.visible;
        };

        //TODO: Сделать в директиве
        $timeout(function () {
            document.getElementById('secondary-toolbar-actions').style.opacity = 1;
        });
    });
});