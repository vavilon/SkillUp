
module.exports = function(knex, userHasSkills) {
    function callback (solution, task, req, res, next) {
        var checked = req.body.is_correct ? 'checked_correct' : 'checked_incorrect';
        //Учитываем данные текущего проверяющего для того чтобы не делать UPDATE solutions два раза
        var count = 0, correctLength = 0, incorrectLength = 0;
        solution.checked_correct = solution.checked_correct || [];
        if (req.body.is_correct) solution.checked_correct.push(req.user.id);
        correctLength = solution.checked_correct.length;

        solution.checked_incorrect = solution.checked_incorrect || [];
        if (!req.body.is_correct) solution.checked_incorrect.push(req.user.id);
        incorrectLength = solution.checked_incorrect.length;

        count = correctLength + incorrectLength;
        //Корректно ли решение
        var correct = correctLength / count >= GLOBAL.CORRECT_CONSTANT;

        //Добавим в решение данные текущего проверяющего и заодно запишем, корректно ли решение
        var raw = "UPDATE solutions SET " + checked + " = array_append(" + checked + ", '" + req.user.id + "')";
        if (req.body.is_correct) raw += ", rating = rating + " + (req.body.rating || 1);
        if (count === GLOBAL.COUNT_TO_CHECK) raw += ", is_correct = " + correct;
        raw += " WHERE id = '" + req.body.solution_id + "';";

        knex.raw(raw).then(function() {
            //Добавим проверяющему в массив проверенных решений текущее решение
            knex.raw("UPDATE users SET solutions_checked = array_append(solutions_checked, '" + req.body.solution_id + "')"
                + " WHERE id = '" + req.user.id + "';").then(function() {
                res.end('ok');
                if (count === GLOBAL.COUNT_TO_CHECK) {
                    var arr = {}; //Если оценка проверяющего совпадает с большинством - начислим ему експу и скиллы
                    if (correct) {//Дальше скиллы проверяющим домножатся на константу, чтобы уменьшить их количество
                        for (var i in solution.checked_correct) arr[solution.checked_correct[i]] = {exp: task.exp, skills: 1};
                        for (var i in solution.checked_incorrect) arr[solution.checked_incorrect[i]] = {exp: 0, skills: 0};
                    } else {
                        for (var i in solution.checked_correct) arr[solution.checked_correct[i]] = {exp: 0, skills: 0};
                        for (var i in solution.checked_incorrect) arr[solution.checked_incorrect[i]] = {exp: task.exp, skills: 1};
                    }

                    //Начислим експу всем проверившим. Автору решения експа не начисляется
                    var q = "UPDATE users SET exp = exp + CASE \n";
                    for (var id in arr) q += "\n WHEN id = '" + id + "' THEN " + arr[id].exp;
                    q += "\n ELSE 0 END;";

                    knex.raw(q).then(function() {
                        var skillsRecord = knex.idsToRecord(task.skills);
                        //Обновим скиллы автору решения (которые у него уже есть)
                        var q = "UPDATE skills_progress SET count = count + CASE \n";
                        if (correct) q += "WHEN user_id = '" + solution.user_id + "' AND skill_id in " + skillsRecord + " THEN 1";

                        //Обновим скиллы всем проверившим
                        for (var id in arr) q += "\n WHEN user_id = '" + id + "' AND skill_id in "
                            + skillsRecord + " THEN " + (arr[id].skills * GLOBAL.CHECK_SKILLS_MULTIPLIER);
                        q += "\n ELSE 0 END;";
                        knex.raw(q).then(function (){
                            if (correct) {
                                //Добавим скиллы автору решения (которые отсутствовали при обновлении)
                                knex('skills_progress').select('skill_id').where('user_id', solution.user_id).pluck('skill_id').then(function (sp) {
                                    //Отфильтруем только те скиллы, которых у решившего нет
                                    var newSkills = task.skills.filter(function (skillID) {
                                        return sp.indexOf(skillID) === -1;
                                    });
                                    //Сформируем массив значений на вставку
                                    var values = [];
                                    for (var i in newSkills)
                                        values.push({user_id: solution.user_id, skill_id: newSkills[i], count: 1});
                                    knex('skills_progress').insert(values).then(function(){
                                        //Если зашло сюда, то все ок
                                        console.log('Solution with id ' + req.body.solution_id + ' checked with result ' + correct);
                                    }).catch(function (error) {
                                        console.log(error);
                                    });
                                }).catch(function (error) {
                                    console.log(error);
                                });
                            }
                        }).catch(function (error) {
                            console.log(error);
                        });
                    }).catch(function (error) {
                        console.log(error);
                    });
                }
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        }).catch(function (error) {
            console.log(error);
            res.end();
        });
    }

    return function (req, res, next) {
        if (req.isAuthenticated()) { //Нельзя проверить то что уже проверял
            if (req.user.solutions_checked && req.user.solutions_checked.indexOf(req.body.solution_id) !== -1) {
                res.end();
            }
            else knex('solutions').where('id', '=', req.body.solution_id)
                .select('is_correct', 'task_id', 'checked_correct', 'checked_incorrect', 'user_id')
                .then(function(solutions) { //Нельзя проверить уже проверенное
                    if (solutions[0].is_correct !== null || solutions[0].user_id === req.user.id) {
                        res.end();
                    }
                    else knex('tasks').where('id', '=', solutions[0].task_id).select('exp', 'skills').then(function(tasks) {
                        if (!req.user.admin) {
                            knex('skills_progress').where('user_id', '=', req.user.id).select('skill_id as id', 'count')
                                .then(function(userSkills) { //Есть ли у проверяющего скиллы для проверки
                                    if (!userHasSkills(userSkills, tasks[0].skills)) {
                                        res.end();
                                    }
                                    else callback(solutions[0], tasks[0], req, res, next);
                                }).catch(function (error) {
                                    console.log(error);
                                    res.end();
                                });
                        }
                        else callback(solutions[0], tasks[0], req, res, next);
                    }).catch(function (error) {
                        console.log(error);
                        res.end();
                    });
                }).catch(function (error) {
                    console.log(error);
                    res.end();
                });
        }
        else res.end();
    };
};