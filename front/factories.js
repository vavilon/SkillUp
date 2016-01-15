app.factory('getObjByID', function() {
    return function(id, collection) {
        for (var elem in collection)
            if (collection[elem].id === id) return collection[elem];
    };
});

//Вызывается в run, а также при регистрации, входе и выходе
app.factory('loadLoggedUser', function($rootScope, $http, parseSkills) {
    return function(callback) {
        $http.get('/logged_user').success(function (data) {
            $rootScope.loggedUser = data[0];
            if ($rootScope.loggedUser) {
                parseSkills($rootScope.loggedUser, true);
                if ($rootScope.loggedUser.birthday) $rootScope.loggedUser.birthday = new Date($rootScope.loggedUser.birthday);
                try {
                    $rootScope.loggedUser.education = JSON.parse($rootScope.loggedUser.education);
                } catch (e) {}
                try {
                    $rootScope.loggedUser.work = JSON.parse($rootScope.loggedUser.work);
                } catch (e) {}

                for (var i in $rootScope.loggedUser.education) {
                    if ($rootScope.loggedUser.education[i].startYear)
                        $rootScope.loggedUser.education[i].startYear = +$rootScope.loggedUser.education[i].startYear;
                    if ($rootScope.loggedUser.education[i].endYear)
                        $rootScope.loggedUser.education[i].endYear = +$rootScope.loggedUser.education[i].endYear;
                }

                for (var i in $rootScope.loggedUser.work) {
                    if (typeof $rootScope.loggedUser.work[i].startDate == "string")
                        $rootScope.loggedUser.work[i].startDate = new Date($rootScope.loggedUser.work[i].startDate);
                    if (typeof $rootScope.loggedUser.work[i].endDate == "string")
                        $rootScope.loggedUser.work[i].endDate = new Date($rootScope.loggedUser.work[i].endDate);
                }
            }
            callback && callback($rootScope.loggedUser);
        });
    };
});

app.factory('appendProgressToExs', function($rootScope) {
    return function () {
        var userSkills = $rootScope.loggedUser.skills, userNeeds = $rootScope.loggedUser.needs;
        var skills = $rootScope.exs.skills;
        for (var i in userSkills) {
            skills[userSkills[i].skill_id].count = userSkills[i].count;
        }
        for (var i in userNeeds) {
            skills[userNeeds[i].skill_id].count = userNeeds[i].count;
            skills[userNeeds[i].skill_id].need = true;
        }
    };
});

//Вызывается в ng-show или ng-if, чтобы определить, что показывать в зависимости от того, вошел юзер или не вошел
app.factory('isLoggedIn', function($rootScope){
    return function() {
        return $rootScope.loggedUser ? true : false;
    };
});

app.factory('loggedUser', function($rootScope) {
    return function() {
        return $rootScope.loggedUser;
    };
});

app.factory('isImage', function($q) {
    return  function(src) {
        var deferred = $q.defer();
        var image = new Image();
        image.onerror = function() {
            deferred.resolve(false);
        };
        image.onload = function() {
            deferred.resolve(true);
        };
        image.src = src;
        return deferred.promise;
    };
});

/**
 *  Принимает объект, содержащий поле skills и модифицирует этот объект, превращая строку skills в массив объектов
 *  типа {skill_id: int, count: float}, и добавляет needs, если второй параметр true.
 *  Пример строки skills: {"(39,0.387448,t)","(89,1,f)","(44,0.514484,t)","(49,0,)"}
 *
 * @param {object}  obj            Объект, содержащий поле skills
 * @param {boolean} withNeeds      Создавать ли в obj поле needs
 */
app.factory('parseSkills', function() {
    return function(obj, withNeeds) {
        if (!obj.skills) return;
        var re = /"\((\d+),(\d+\.?\d*),?(.)?\)"/g;
        var m;
        var skills = [], needs = [];
        try {
            while ((m = re.exec(obj.skills)) !== null) {
                if (m.index === re.lastIndex) {
                    re.lastIndex++;
                }
                var skill = {skill_id: parseInt(m[1]), count: parseFloat(m[2])};
                if (withNeeds && m[3] === 't') needs.push(skill);
                else if (skill.count > 0) skills.push(skill);
            }
            obj.skills = skills;
            if (withNeeds) obj.needs = needs;
        }
        catch (e) { }
    };
});

app.factory('setPropertyComparingArrays', function() {
    return function(compPropName, setPropName, setValue, setArray, compArray) {
        if (!angular.isObject(setArray) || !angular.isObject(compArray)) return;
        for (var i in setArray) {
            for (var j in compArray) {
                if (setArray[i][compPropName] === compArray[j]) {
                    setArray[i][setPropName] = setValue;
                    break;
                }
            }
        }
    };
});

app.factory('setPropertyComparingObjArr', function() {
    return function(compPropName, setPropName, setValue, setObj, compArray) {
        if (!angular.isObject(setObj) || !angular.isObject(compArray)) return;
        for (var j in compArray) {
            if (setObj[compPropName] === compArray[j]) {
                setObj[setPropName] = setValue;
                break;
            }
        }
    };
});

app.factory('setPropertyFuzzy', function (setPropertyComparingArrays, setPropertyComparingObjArr) {
    return function(newPropName, setArray, compArray, multiple, compPropName, condition) {
        if (multiple) setPropertyComparingArrays(compPropName || 'id', newPropName, true, setArray, compArray, condition);
        else setPropertyComparingObjArr(compPropName || 'id', newPropName, true, setArray, compArray, condition);
    };
});

app.factory('setNotReceivable', function(setPropertyFuzzy) {
    return function(setArray, compArray, multiple, compPropName) {
        setPropertyFuzzy('notReceivable', setArray, compArray, multiple, compPropName);
    };
});

app.factory('skillsToIDs', function () {
    return function(skillsProgress) {
        var res = [];
        for (var i in skillsProgress) {
            res.push(skillsProgress[i].skill_id);
        }
        return res;
    };
});

app.factory('loadFunc', function($http) {
    return function(options, callback) {
        if (!options) return;
        $http.post('/db/' + options.tableName, options).success(callback);
    };
});

app.factory('loadTasks', function(loadFunc) {
    return function(options, callback) {
        options = options || {};
        options.tableName = 'tasks';
        loadFunc(options, callback);
    };
});

app.factory('loadUsers', function(loadFunc) {
    return function(options, callback) {
        options = options || {};
        options.tableName = 'users';
        loadFunc(options, callback);
    };
});

app.factory('loadSolutions', function(loadFunc) {
    return function(options, callback) {
        options = options || {};
        options.tableName = 'solutions';
        loadFunc(options, callback);
    };
});

app.factory('completedSkills', function ($rootScope) {
    return function (skillsProgress) {
        var res = [];
        for (var i in skillsProgress) {
            if (skillsProgress[i].count >= 1)
                res.push({skill_id: skillsProgress[i].skill_id, title: $rootScope.exs.skills[skillsProgress[i].skill_id].title,
                    count: skillsProgress[i].count});
        }
        return res;
    };
});

/**
 *  Модифицирует table, добавляя свойства:
 *                              columns     (object)    содержит названия и параметры колонок таблицы
 *                              columnNames (array)     названия колонок
 *
 * @param {object} table    Объект, содержащий свойства:
 *                              name        (string)    имя таблицы
 *                              rows        (array)     данные таблицы
 *                              ...
 */
app.factory('getColumns', function ($http) {
    return function (table) {
        $http.get('/db/' + table.name + '/columns').success(function (data) {
            table.columns = data;
            table.columnNames = Object.getOwnPropertyNames(data);
        });
    };
});

/**
 * @param {array} rows              Массив данных в виде {object}
 * @param {number} rowsPerPage      Кол-во данных на странице
 * @param {number} pageNumber       Номер страницы
 * @param {number} rowsCount        Общее количество данных в таблице БД
 *
 * @return {array}                  Часть входного массива определенная количеством данных на странице или пустой массив
 */
app.factory('getRowsOnPage', function () {
    return function (rows, rowsPerPage, pageNumber, rowsCount) {
        if (!rows) return [];
        var to = rowsPerPage * (pageNumber + 1);
        if (to > rowsCount) to = rowsCount;
        return rows.slice(rowsPerPage * pageNumber, to);
    }
});

app.factory('bindToNavtabs', function ($rootScope) {
    return function(scope, bindObjName) {
        $rootScope.navtabs = scope[bindObjName];

        $rootScope.$watch('navtabs.selected', function (newValue, oldValue) {
            if (newValue !== undefined) scope[bindObjName].selected = newValue;
        });

        scope.$watch(bindObjName + '.selected', function (newValue, oldValue) {
            if (newValue !== undefined) $rootScope.navtabs.selected = newValue;
        });
    };
});