
var countToCheck = 3, correctConstant = 2 / 3;

module.exports = function(knex, userHasSkills) {
    function callback (solutions, tasks, req, res, next) {
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
            knex.raw("UPDATE users SET solutions_checked = array_append(solutions_checked, '" + req.body.solution_id + "')"
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
    }

    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.attributes.solutions_checked && req.user.attributes.solutions_checked.indexOf(req.body.solution_id) !== -1) {
                res.end();
                return;
            }

            knex('solutions').where('id', '=', req.body.solution_id)
                .select('is_correct', 'task_id', 'checked_correct', 'checked_incorrect', 'user_id')
                .then(function(solutions) {
                    if (solutions[0].is_correct !== null || solutions[0].user_id === req.user.id) {
                        res.end();
                        return;
                    }
                    knex('tasks').where('id', '=', solutions[0].task_id).select('exp', 'skills').then(function(tasks) {
                        if (!req.user.attributes.admin) {
                            knex('skills_progress').where('user_id', '=', req.user.id).select('skill_id as id', 'count')
                                .then(function(userSkills) {
                                    if (!userHasSkills(userSkills, tasks[0].skills)) {
                                        res.end();
                                        return;
                                    }
                                    callback(solutions, tasks, req, res, next);
                                }).catch(function (error) {
                                    console.log(error);
                                    res.end();
                                });
                        }
                        else callback(solutions, tasks, req, res, next);
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