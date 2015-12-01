
module.exports = function(knex, userHasSkills) {
    function callback (solution, task, req, res, next) {
        var checked = req.body.is_correct ? 'checked_correct' : 'checked_incorrect';

        var count = 0, correctLength = 0, incorrectLength = 0;
        if (solution.checked_correct) correctLength = solution.checked_correct.length + (req.body.is_correct ? 1 : 0);
        if (solution.checked_incorrect) incorrectLength += solution.checked_incorrect.length + (req.body.is_correct ? 0 : 1);
        count = correctLength + incorrectLength;

        var correct = correctLength / count >= GLOBAL.CORRECT_CONSTANT;

        //Добавим в решение данные текущего проверяющего и за одно запишем, корректно ли задание
        var raw = "UPDATE solutions SET " + checked + " = array_append(" + checked + ", '" + req.user.id + "')";
        if (req.body.is_correct) raw += ", rating = rating + " + (req.body.rating || 1);
        if (count === GLOBAL.COUNT_TO_CHECK) raw += ", is_correct = " + correct;
        raw += " WHERE id = '" + req.body.solution_id + "';";

        knex.raw(raw).then(function(ans) {
            //Добавим проверяющему в массив проверенных решений текущее решение
            knex.raw("UPDATE users SET solutions_checked = array_append(solutions_checked, '" + req.body.solution_id + "')"
                + " WHERE id = '" + req.user.id + "';").then(function() {
                res.end('ok');
                if (count === GLOBAL.COUNT_TO_CHECK) {
                    var arr = {};
                    if (correct) {
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
                        //Наверное, если решение неверно, лучше вообще не включать автора решения в запрос
                        //на обновление скиллов чем добавлять ему 0
                        var q = "UPDATE skills_progress SET count = count + CASE \n"
                            + "WHEN user_id = '" + solution.user_id + "' AND skill_id in " + skillsRecord + " THEN ";
                        if (correct) q += 1;
                        else q += 0;

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
                                        return sp.indexOf(task.skills[i]) === -1;
                                    });
                                    //Сформируем массив значений на вставку
                                    var values = [];
                                    for (var i in newSkills)
                                        values.push({user_id: solution.user_id, skill_id: newSkills[i], count: 1});
                                    knex('skills_progress').insert(values).then(function(){}).catch(function (error) {
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
        if (req.isAuthenticated()) {
            if (req.user.solutions_checked && req.user.solutions_checked.indexOf(req.body.solution_id) !== -1) {
                res.end();
            }
            else knex('solutions').where('id', '=', req.body.solution_id)
                .select('is_correct', 'task_id', 'checked_correct', 'checked_incorrect', 'user_id')
                .then(function(solutions) {
                    if (solutions[0].is_correct !== null || solutions[0].user_id === req.user.id) {
                        res.end();
                    }
                    else knex('tasks').where('id', '=', solutions[0].task_id).select('exp', 'skills').then(function(tasks) {
                        if (!req.user.admin) {
                            knex('skills_progress').where('user_id', '=', req.user.id).select('skill_id as id', 'count')
                                .then(function(userSkills) {
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