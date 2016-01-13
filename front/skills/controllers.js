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


app.controller('skillsCtrl', function ($scope, $http, $filter, $rootScope, $location, isLoggedIn, loadLoggedUser, appendProgressToExs, $timeout) {
    if (!isLoggedIn()) { $location.path('/main'); return; }
    $rootScope.ajaxCall.promise.then(function () {
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
        $scope.editNeed = function (id, remove) {
            $http.post('/needs', {remove: remove, needs: [id]}).success(function (data) {
                var userNeeds = $rootScope.loggedUser.needs;
                if (data == 'added') {
                    $rootScope.exs.skills[id].need = true;
                    if ($rootScope.exs.skills[id].count === undefined) $rootScope.exs.skills[id].count = 0;
                    userNeeds.push({skill_id: +id, count: $rootScope.exs.skills[id].count})
                }
                else if (data == 'removed') {
                    $rootScope.exs.skills[id].need = false;
                    if ($rootScope.exs.skills[id].count === 0) delete $rootScope.exs.skills[id].count;
                    userNeeds.splice(userNeeds.findIndex(function (el) {
                        return el.skill_id == id;
                    }), 1);
                }
                console.log($rootScope.loggedUser.needs);
                //TODO: Оповещать пользователя про добавление ему в нидсы скила
            });
        };

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