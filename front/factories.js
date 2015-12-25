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
            if (data) $rootScope.loggedUser.skills = parseSkills($rootScope.loggedUser.skills);
            callback && callback(data);
        });
    };
});

app.factory('appendProgressToExs', function($rootScope) {
    return function () {
        var progress = $rootScope.loggedUser.skills, skills = $rootScope.exs.skills;
        for (var i in progress) {
            skills[progress[i].id].count = progress[i].count;
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

app.factory('educationObjToArr', function() {
    return function(education) {
        var educationArr = [], s = '', buff = {};
        for (var i in education) {
            buff = education[i];
            s = buff.school.name;
            if (buff.year && buff.year.name) s += ' (' + buff.year.name + ')';
            if (buff.concentration && buff.concentration[0] && buff.concentration[0].name) {
                s += ', ' + buff.concentration[0].name;
            }
            educationArr.push(s);
        }
        return educationArr.reverse();
    };
});

app.factory('workObjToArr', function($filter) {
    return function(work) {
        var workArr = [], s = '', buff = {};
        for (var i in work) {
            buff = work[i];
            s = buff.employer.name;
            if (buff.start_date || buff.end_date) {
                s += ' (';
                if (buff.start_date) s += 'с ' + $filter('date')(buff.start_date, 'MMMM yyyy');
                if (buff.start_date && buff.end_date) s += ' ';
                if (buff.end_date) s += 'по ' + $filter('date')(buff.end_date, 'MMMM yyyy');
                s += ')'
            }
            if (buff.position && buff.position.name) s += ', ' + buff.position.name;
            workArr.push(s);
        }
        return workArr.reverse();
    };
});

app.factory('parseSkills', function() {
    return function(skills) {
        if (!skills) return;
        skills = skills.replace(/{/g, '[');
        skills = skills.replace(/}/g, ']');
        skills = skills.replace(/"\(/g, '{"id": "');
        skills = skills.replace(/\)"/g, '}');
        skills = skills.replace(/},{/g, '} , {');
        skills = skills.replace(/(\S),/g, '$1", "count": ');
        try {
            return JSON.parse(skills);
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

app.factory('setLiked', function(setPropertyFuzzy) {
    return function(setArray, compArray, multiple, compPropName) {
        setPropertyFuzzy('liked', setArray, compArray, multiple, compPropName);
    };
});

app.factory('setReceived', function(setPropertyFuzzy) {
    return function(setArray, compArray, multiple, compPropName) {
        setPropertyFuzzy('received', setArray, compArray, multiple, compPropName);
    };
});

app.factory('setNotReceivable', function(setPropertyFuzzy) {
    return function(setArray, compArray, multiple, compPropName) {
        setPropertyFuzzy('notReceivable', setArray, compArray, multiple, compPropName);
    };
});

app.factory('skillsProgressToIDs', function () {
    return function(skillsProgress) {
        var res = [];
        for (var i in skillsProgress) {
            res.push(skillsProgress[i].id);
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
            if (skillsProgress[i].count >= $rootScope.exs.skills[skillsProgress[i].id].count_to_get)
                res.push(skillsProgress[i].id);
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
});app.factory('addEducation', function (educationObjToArr) {
    return function (edObj) {
        if (!edObj.edName) return;
        var e = {school: {name: edObj.edName}};
        if (edObj.edConc) e.concentration = [{name: edObj.edConc}];
        if (edObj.edYear) e.year = {name: edObj.edYear};

        if (edObj.education && edObj.education.length && edObj.edYear) {
            var inserted = false;
            var j = 0;
            for (var i in edObj.education) {
                if (edObj.education[i].year && edObj.education[i].year.name - 0 > edObj.edYear) {
                    edObj.education.splice(i, 0, e);
                    inserted = true;
                    break;
                } else j = i + 1;
            }
            if (!inserted) edObj.education.splice(j, 0, e);
        }
        else edObj.education.unshift(e);
        edObj.educationArr = educationObjToArr(edObj.education);
        edObj.edName = null;
        edObj.edConc = null;
        edObj.edYear = null;
    };
});

app.factory('removeEducation', function () {
    return function (edObj, index) {
        edObj.education.splice(edObj.education.length - 1 - index, 1);
        edObj.educationArr.splice(index, 1);
    };
});

app.factory('addWork', function (workObjToArr) {
    return function (workObj) {
        if (!workObj.woName) return;
        var w = {employer: {name: workObj.woName}};
        if (workObj.woPosition) w.position = {name: workObj.woPosition};
        if (workObj.woStartDate) w.start_date = workObj.woStartDate;
        if (workObj.woEndDate) w.end_date = workObj.woEndDate;

        if (workObj.work && workObj.work.length && workObj.woEndDate) {
            var inserted = false;
            var j = 0;
            for (var i in workObj.work) {
                if (workObj.work[i].end_date && (new Date(workObj.work[i].end_date)) > workObj.woEndDate) {
                    workObj.work.splice(i, 0, w);
                    inserted = true;
                    break;
                } else j = i + 1;
            }
            if (!inserted) workObj.work.splice(j, 0, w);
        }
        else workObj.work.unshift(w);
        workObj.workArr = workObjToArr(workObj.work);
        workObj.woName = null;
        workObj.woPosition = null;
        workObj.woStartDate = null;
        workObj.woEndDate = null;
    };
});

app.factory('removeWork', function () {
    return function (workObj, index) {
        workObj.work.splice(workObj.work.length - 1 - index, 1);
        workObj.workArr.splice(index, 1);
    };
});