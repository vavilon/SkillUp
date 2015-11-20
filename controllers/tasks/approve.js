
var countToApprove = 3, correctConstant = 2 / 3, correctTaskExpMultiplier = 3, incorrectTaskExpDivider = 2,
    incorrectTaskExp = 200, createTaskSkillMultiplier = 2;

module.exports = function(knex, updateApprovement, userHasSkills) {
    function callback (tasks, req, res, next) {
        updateApprovement(req.body.task_id, req.body.data, req.user.id).then(function() {
            knex.raw("UPDATE users SET tasks_approved = array_append(tasks_approved, '" + req.body.task_id + "')"
                + " WHERE id = '" + req.user.id + "';").then(function() {

                res.end('ok');

                knex('approvements').where('task_id', '=', req.body.task_id).then(function(appr) {
                    var a = appr[0];
                    var count = 0, tc = 0, tic = 0;

                    if (a.title_correct) tc += a.title_correct.length;
                    if (a.title_incorrect) tic += a.title_incorrect.length;

                    count = tc + tic;

                    if (count == countToApprove) {
                        var sc = 0, sic = 0, dc = 0, dic = 0, lc = 0, lic = 0;

                        if (a.skills_correct) sc += a.skills_correct.length;
                        if (a.skills_incorrect) sic += a.skills_incorrect.length;

                        if (a.desc_correct) dc += a.desc_correct.length;
                        if (a.desc_incorrect) dic += a.desc_incorrect.length;

                        if (a.links_correct) lc += a.links_correct.length;
                        if (a.links_incorrect) lic += a.links_incorrect.length;

                        var tcCor = tc / count >= correctConstant;
                        var scCor = sc / count >= correctConstant;
                        var dcCor = dc / count >= correctConstant;
                        var lcCor = lc / count >= correctConstant;

                        var correct = tcCor && scCor && dcCor && lcCor;

                        /*
                        Если задание полностью корректно, то експа начисляется по 1/4 за каждый отмеченный корректно пункт * експу за задание,
                        а скиллы начисляются +1 к каждому из указанных в задании только если большинство пунктов отмечено корректно.
                        Автору задания дается больше експы и очков скилла.

                        Если в задании некорректны ссылки на учебные материалы или название, то скиллы и експа начисляются по той же схеме.
                        Автору задания снимается експа за задание / 4 * количество неправильных пунктов.


                         */

                        knex('tasks').where('id', '=', req.body.task_id).update({is_approved: correct}).then(function() {
                            var arr = {}, curArr;

                            if (tcCor) curArr = a.title_correct;
                            else curArr = a.title_incorrect;
                            for (var i in curArr) {
                                arr[curArr[i]] = {exp: tasks[0].exp / 4, skills: 1 / 4};
                            }

                            if (scCor) curArr = a.skills_correct;
                            else curArr = a.skills_incorrect;
                            for (var i in curArr) {
                                arr[curArr[i]].exp += tasks[0].exp / 4;
                                arr[curArr[i]].skills += 1 / 4;
                            }

                            if (dcCor) curArr = a.desc_correct;
                            else curArr = a.desc_incorrect;
                            for (var i in curArr) {
                                arr[curArr[i]].exp += tasks[0].exp / 4;
                                arr[curArr[i]].skills += 1 / 4;
                            }

                            if (lcCor) curArr = a.links_correct;
                            else curArr = a.links_incorrect;
                            for (var i in curArr) {
                                arr[curArr[i]].exp += tasks[0].exp / 4;
                                arr[curArr[i]].skills += 1 / 4;
                            }

                            if (task.correct) {
                                for (var user in users) {
                                    user.exp += exp;
                                    user.skills[task.skills] += 1;
                                }
                                author.exp += exp * 3;
                                author.skills[task.skills] += 2;
                            }
                            else {

                            }

                            var q = "UPDATE users SET exp = exp + CASE \n";
                            q += "WHEN id = '" + tasks[0].author + "' THEN ";
                            if (correct) q += tasks[0].exp * correctTaskExpMultiplier;
                            else q += -tasks[0].exp / incorrectTaskExpDivider;

                            for (var id in arr) q += "\n WHEN id = '" + id + "' THEN " + arr[id].exp;
                            q += "\n ELSE 0 END;";
                            console.log(q);

                            knex.raw(q).then(function() {

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
                res.end();
            });
        }).catch(function (error) {
            console.log(error);
            res.end();
        });
    }

    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.attributes.tasks_approved && req.user.attributes.tasks_approved.indexOf(req.body.task_id) !== -1
                || req.user.attributes.tasks_created && req.user.attributes.tasks_created.indexOf(req.body.task_id) !== -1) {
                res.end();
                return;
            }
            knex('tasks').where('id', '=', req.body.task_id).select('is_approved', 'skills', 'exp', 'author').then(function(tasks) {
                if (tasks[0].is_approved !== null) {
                    res.end();
                    return;
                }

                if (!req.user.attributes.admin) {
                    knex('skills_progress').where('user_id', '=', req.user.id).select('skill_id as id', 'count')
                        .then(function(userSkills) {
                            if (!userHasSkills(userSkills, tasks[0].skills)) {
                                res.end();
                                return;
                            }
                            callback(tasks, req, res, next);
                        }).catch(function (error) {
                            console.log(error);
                            res.end();
                        });
                }
                callback(tasks, req, res, next);
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        }
        else res.end();
    };
};