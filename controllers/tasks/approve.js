
var parseSP = require('../../lib/parse-skills-progress');
var userHasSkills = require('../../lib/user-has-skills');

var countToApprove = 3, correctConstant = 2 / 3, createTaskAwardMultiplier = 3;

module.exports = function(knex, updateArray, pgApprove) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.attributes.tasks_approved && req.user.attributes.tasks_approved.indexOf(req.body.task_id) !== -1
                || req.user.attributes.tasks_created && req.user.attributes.tasks_created.indexOf(req.body.task_id) !== -1) {
                res.end();
                return;
            }
            knex('tasks').where('id', '=', req.body.task_id).select('is_approved', 'approvement_id', 'skills', 'exp', 'author').then(function(rows) {
                if (rows[0].is_approved !== null) {
                    res.end();
                    return;
                }

                if (!req.user.attributes.admin) {
                    var userSkills = parseSP(req.user.attributes.skills);
                    if (!userHasSkills(userSkills, rows[0].skills)) {
                        res.end();
                        return;
                    }
                }

                pgApprove(req.body.task_id, req.body.data, req.user.id, function(err, result) {
                    if (err) {
                        res.end();
                        return console.error('error running query', err);
                    }

                    knex.raw("UPDATE users SET tasks_approved = array_append(tasks_approved, '" + req.body.task_id + "')"
                        + ", exp = exp + " + rows[0].exp  + " WHERE id = '" + req.user.id + "';").then(function() {

                        res.end('ok');

                        knex('approvements').where('task_id', '=', req.body.task_id).then(function(rows) {
                            var a = rows[0];
                            var count = 0, tc = 0, tic = 0, sc = 0, sic = 0, dc = 0, dic = 0, lc = 0, lic = 0;

                            if (a.title_correct) tc += a.title_correct.length;
                            if (a.title_incorrect) tic += a.title_incorrect.length;

                            if (a.skills_correct) sc += a.skills_correct.length;
                            if (a.skills_incorrect) sic += a.skills_incorrect.length;

                            if (a.desc_correct) dc += a.desc_correct.length;
                            if (a.desc_incorrect) dic += a.desc_incorrect.length;

                            if (a.links_correct) lc += a.links_correct.length;
                            if (a.links_incorrect) lic += a.links_incorrect.length;

                            count = tc + tic;

                            if (count == countToApprove) {
                                var correct = (tc / count >= correctConstant) && (sc / count >= correctConstant) &&
                                    (dc / count >= correctConstant) && (lc / count >= correctConstant);
                                knex('tasks').where('id', '=', req.body.task_id).update({is_approved: correct}).then(function() {
                                    console.log('Task approved!');

                                    if (correct) knex('users').where('id', '=', rows[0].author)
                                        .increment('exp', rows[0].exp * createTaskAwardMultiplier)
                                        .then(function() {

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
                });
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        }
        else res.end();
    };
};