app.factory('getObjByID', function() {
    return function(id, collection) {
        for (var elem in collection)
            if (collection[elem].id === id) return collection[elem];
    };
});

//Вызывается в run, а также при регистрации, входе и выходе
app.factory('getIsLoggedIn', function($rootScope, $http, parseSkills) {
    return function(callback) {
        $http.get('/logged_user').success(function (data) {
            $rootScope.loggedUser = data;
            if (data) $rootScope.loggedUser.skills = parseSkills($rootScope.loggedUser.skills);
            callback && callback(data);
        });
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

app.factory('educationStr', function() {
    return function(education) {
        var educationStr = [], s = '', buff = {};
        for (var i in education) {
            buff = education[i];
            s = buff.school.name;
            if (buff.year && buff.year.name) s += ' (' + buff.year.name + ')';
            if (buff.concentration && buff.concentration[0] && buff.concentration[0].name) {
                s += ', ' + buff.concentration[0].name;
            }
            educationStr.push(s);
        }
        return educationStr.reverse();
    };
});

app.factory('workStr', function($filter) {
    return function(work) {
        var workStr = [], s = '', buff = {};
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
            workStr.push(s);
        }
        return workStr.reverse();
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
        return JSON.parse(skills);
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

app.factory('setLiked', function(setPropertyComparingArrays, setPropertyComparingObjArr) {
    return function(setArray, compArray, multiple) {
        if (multiple) setPropertyComparingArrays('id', 'liked', true, setArray, compArray);
        else setPropertyComparingObjArr('id', 'liked', true, setArray, compArray);
    };
});

app.factory('setReceived', function(setPropertyComparingArrays, setPropertyComparingObjArr) {
    return function(setArray, compArray, multiple) {
        if (multiple) setPropertyComparingArrays('id', 'received', true, setArray, compArray);
        else setPropertyComparingObjArr('id', 'received', true, setArray, compArray);
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
        $http.post('/db/' + options.tableName, options).success(callback);
    };
});

app.factory('loadTasks', function(loadFunc) {
    return function(options, callback) {
        options.tableName = 'tasks';
        loadFunc(options, callback);
    };
});

app.factory('loadUsers', function(loadFunc) {
    return function(options, callback) {
        options.tableName = 'users';
        loadFunc(options, callback);
    };
});

app.factory('loadSolutions', function(loadFunc) {
    return function(options, callback) {
        options.tableName = 'solutions';
        loadFunc(options, callback);
    };
});

app.factory('loadReceivedTasks', function (loadTasks, loggedUser) {
    return function(offset, callback) {
        loadTasks({ids: loggedUser().tasks_received, offset: offset}, callback);
    };
});

app.factory('loadRecommendedTasks', function (loadTasks, skillsProgressToIDs, loggedUser) {
    return function(offset, callback) {
        loadTasks({offset: offset, skills: skillsProgressToIDs(loggedUser().skills)}, callback);
    };
});