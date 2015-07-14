
var parseSP = require('../../lib/parse-skills-progress');
var userHasSkills = require('../../lib/user-has-skills');

var countToCheck = 3, correctConstant = 2 / 3;

//Добавить проверку, проверял ли пользователь такое задание!!!
module.exports = function(knex, updateArray) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            knex('solutions').where('id', '=', req.body.solution_id)
                .select('is_correct', 'task_id', 'checked_correct', 'checked_incorrect')
                .then(function(solutions) {
                    if (solutions[0].is_correct) {
                        return res.end();
                    }
                    knex('tasks').where('id', '=', solutions[0].task_id).select('exp', 'skills').then(function(tasks) {
                        if (!req.user.attributes.admin) {
                            var userSkills = parseSP(req.user.attributes.skills);
                            if (!userHasSkills(userSkills, tasks[0].skills)) {
                                res.end();
                                return;
                            }
                        }

                        var checked = req.body.is_correct ? 'checked_correct' : 'checked_incorrect';

                        var count = 0, correct = 0, incorrect = 0;
                        if (solutions[0].checked_correct) correct = solutions[0].checked_correct.length;
                        if (solutions[0].checked_incorrect) incorrect += solutions[0].checked_incorrect.length;
                        count = correct + incorrect + 1;

                        var raw = "UPDATE solutions SET " + checked + " = array_append(" + checked + ", '" + req.user.id + "')";
                        if (req.body.is_correct) raw += ", rating = rating + " + (req.body.rating || 1);
                        if (count === countToCheck) raw += ", is_correct = " + (correct / count >= correctConstant);
                        raw += " WHERE id = '" + req.body.solution_id + "';";

                        knex.raw(raw).then(function(ans) {
                            knex.raw("UPDATE users SET tasks_checked = array_append(tasks_checked, '" + solutions[0].task_id + "')"
                                + ", exp = exp + " + tasks[0].exp  + " WHERE id = '" + req.user.id + "';").then(function() {
                                res.end('ok');
                            }).catch(function (error) {
                                console.log(error);
                                res.end();
                            });
                        }).catch(function (error) {
                            console.log(error);
                            res.end();
                        });
                    }).catch(function (error) {
                        console.log(error);
                        res.end();
                    });
                })
                .catch(function (error) {
                    console.log(error);
                    res.end();
                });
        }
        else res.end();
    };
};