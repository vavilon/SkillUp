
module.exports = function (knex, updateApprovement, userHasSkills) {
    function callback(task, req, res, next) {
        //Вызов этой функции добавляет в approvements данные подтверждения (title_correct, skills_correct etc.)
        //и возвращает обновленную запись (appr.rows[0], .returning('*') из knex не пашет)
        updateApprovement(req.body.task_id, req.body.data, req.user.id).then(function (appr) {
            //Добавим подтверждающему id задания в массив tasks_approved
            knex.raw("UPDATE users SET tasks_approved = array_append(tasks_approved, '" + req.body.task_id + "')"
                + " WHERE id = '" + req.user.id + "';").then(function () {

                res.end('ok');

                var a = appr.rows[0];
                var count = 0, tc = 0, tic = 0;
                //Используя title_correct + title_incorrect посчитаем количество подтвердивших
                if (a.title_correct) tc += a.title_correct.length;
                if (a.title_incorrect) tic += a.title_incorrect.length;
                count = tc + tic;
                //Если достаточно, начинаем процесс подтверждения
                if (count == GLOBAL.COUNT_TO_APPROVE) {
                    var sc = 0, sic = 0, dc = 0, dic = 0, lc = 0, lic = 0;

                    if (a.skills_correct) sc += a.skills_correct.length;
                    if (a.skills_incorrect) sic += a.skills_incorrect.length;

                    if (a.desc_correct) dc += a.desc_correct.length;
                    if (a.desc_incorrect) dic += a.desc_incorrect.length;

                    if (a.links_correct) lc += a.links_correct.length;
                    if (a.links_incorrect) lic += a.links_incorrect.length;
                    //Проверим задание на корректность по каждому из критериев
                    var tcCor = tc / count >= GLOBAL.CORRECT_CONSTANT;
                    var scCor = sc / count >= GLOBAL.CORRECT_CONSTANT;
                    var dcCor = dc / count >= GLOBAL.CORRECT_CONSTANT;
                    var lcCor = lc / count >= GLOBAL.CORRECT_CONSTANT;
                    //Задание корректно только если по всем критериям корректно
                    var correct = tcCor && scCor && dcCor && lcCor;

                    /*
                     Если задание полностью корректно, то експа начисляется по 1/4 за каждый отмеченный корректно пункт * експу за задание,
                     а скиллы начисляются +1 к каждому из указанных в задании только если большинство пунктов отмечено корректно.
                     Автору задания дается больше експы и очков скилла. В случае некорректного задания с автора снимается експа.
                     */

                    knex('tasks').where('id', '=', req.body.task_id).update({is_approved: correct}).then(function () {
                        var arr = {}, curArr;

                        for (var i in a.title_correct) arr[a.title_correct[i]] = {exp: 0, skills: 0};
                        for (var i in a.title_incorrect) arr[a.title_incorrect[i]] = {exp: 0, skills: 0};

                        if (tcCor) curArr = a.title_correct;
                        else curArr = a.title_incorrect;
                        for (var i in curArr) {
                            arr[curArr[i]] = {exp: task.exp / 4, skills: 1 / 4};
                        }

                        if (scCor) curArr = a.skills_correct;
                        else curArr = a.skills_incorrect;
                        for (var i in curArr) {
                            arr[curArr[i]].exp += task.exp / 4;
                            arr[curArr[i]].skills += 1 / 4;
                        }

                        if (dcCor) curArr = a.desc_correct;
                        else curArr = a.desc_incorrect;
                        for (var i in curArr) {
                            arr[curArr[i]].exp += task.exp / 4;
                            arr[curArr[i]].skills += 1 / 4;
                        }

                        if (lcCor) curArr = a.links_correct;
                        else curArr = a.links_incorrect;
                        for (var i in curArr) {
                            arr[curArr[i]].exp += task.exp / 4;
                            arr[curArr[i]].skills += 1 / 4;
                        }
                        //Начислим експу автору задания
                        var q = "UPDATE users SET exp = exp + CASE \n"
                            + "WHEN id = '" + task.author + "' THEN ";
                        if (correct) q += task.exp * GLOBAL.CORRECT_TASK_EXP_MULTIPLIER;
                        else q += -task.exp / GLOBAL.INCORRECT_TASK_EXP_DIVIDER;
                        //Начислим експу подтвердившим
                        for (var id in arr) q += "\n WHEN id = '" + id + "' THEN " + arr[id].exp;
                        q += "\n ELSE 0 END;";

                        knex.raw(q).then(function () {
                            //Преобразуем массив в sql record, чтобы можно было использовать в выражении skill_id IN skillsRecord
                            var skillsRecord = knex.idsToRecord(task.skills);
                            //Даем скиллы автору задания
                            var q = "UPDATE skills_progress SET count = count + CASE \n"
                                + "WHEN user_id = '" + task.author + "' AND skill_id IN " + skillsRecord + " THEN ";
                            if (correct) q += 1;
                            else q += 0;
                            //Даем скиллы подтвердившим задание
                            for (var id in arr) q += "\n WHEN user_id = '" + id + "' AND skill_id in "
                                + skillsRecord + " THEN " + (arr[id].skills * GLOBAL.APPROVE_SKILLS_MULTIPLIER);
                            q += "\n ELSE 0 END;";
                            knex.raw(q).then(function () {
                                //Если зашло сюда, то все ок
                                console.log('Task with id ' + req.body.task_id + ' approved with result ' + correct);
                            }).catch(function (error) {
                                console.log(error);
                            });
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
            //Нельзя подтвердить то, что уже подтверждал, и то, что сам создал
            if (req.user.tasks_approved && req.user.tasks_approved.indexOf(req.body.task_id) !== -1
                || req.user.tasks_created && req.user.tasks_created.indexOf(req.body.task_id) !== -1) {
                res.end();
            }
            else knex('tasks').where('id', '=', req.body.task_id).select('is_approved', 'skills', 'exp', 'author').then(function (tasks) {
                //Нельзя подтвердить уже подтвержденное задание
                if (tasks[0].is_approved !== null) {
                    res.end();
                }
                else if (!req.user.admin) {
                    knex('skills_progress').where('user_id', '=', req.user.id).select('skill_id as id', 'count')
                        .then(function (userSkills) {
                            //Есть ли у подтверждающего скиллы для подтверждения этого задания
                            if (!userHasSkills(userSkills, tasks[0].skills)) {
                                res.end();
                            }
                            else callback(tasks[0], req, res, next);
                        }).catch(function (error) {
                            console.log(error);
                            res.end();
                        });
                }
                else callback(tasks[0], req, res, next);
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        }
        else res.end();
    };
};