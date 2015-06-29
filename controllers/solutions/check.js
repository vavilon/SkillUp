
var parseSP = require('../../lib/parse-skills-progress');
var userHasSkills = require('../../lib/user-has-skills');

var countToCheck = 3, correctConstant = 2 / 3;
var callback = function(knex, updateArray, task_id, req, res, next) {
    updateArray('users', 'tasks_checked', req.user.id, 'append', task_id, function (err, result) {
        if (err) {
            res.end();
            return console.error('error running query', err);
        }
        knex('solutions').where('id', '=', req.body.solution_id).select('checked_correct', 'checked_incorrect')
            .then(function(rows) {
                var count = 0, correct = 0, incorrect = 0;
                if (rows[0].checked_correct) correct = rows[0].checked_correct.length;
                if (rows[0].checked_incorrect) incorrect += rows[0].checked_incorrect.length;
                count = correct + incorrect;
                if (count === countToCheck) {
                    knex('solutions').where('id', '=', req.body.solution_id).update({'is_correct': (correct / count >= correctConstant)})
                        .then(function() {
                            res.end('ok');
                        }).catch(function (error) {
                            console.log(error);
                            res.end();
                        });
                }
                else {
                    res.end('ok');
                }
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
    });
};

var callbackUHS = function(knex, updateArray, task_id, req, res, next) {
    if (req.body.is_correct) {
        updateArray('solutions', 'checked_correct', req.body.solution_id, 'append', req.user.id, function (err, result) {
            if (err) {
                res.end();
                return console.error('error running query', err);
            }
            knex('solutions').where('id', '=', req.body.solution_id).increment('rating', req.body.rating || 1)
                .then(function(){
                    callback(knex, updateArray, task_id, req, res, next);
                })
                .catch(function (error) {
                    console.log(error);
                    res.end();
                });
        });
    }
    else {
        updateArray('solutions', 'checked_incorrect', req.body.solution_id, 'append', req.user.id, function (err, result) {
            if (err) {
                res.end();
                return console.error('error running query', err);
            }
            callback(knex, updateArray, task_id, req, res, next);
        });
    }
};

//Добавить проверку, проверял ли пользователь такое задание!!!
module.exports = function(knex, updateArray) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            knex('solutions').where('id', '=', req.body.solution_id).select('is_correct', 'task_id')
                .then(function(rows) {
                    if (rows[0].is_correct) {
                        return res.end();
                    }

                    var task_id = rows[0].task_id;

                    if (!req.user.attributes.admin) {
                        knex('tasks').where('id', '=', task_id).select('skills').then(function(rows) {
                            var userSkills = parseSP(req.user.attributes.skills);
                            if (!userHasSkills(userSkills, rows[0].skills)) {
                                res.end();
                                return;
                            }
                            callbackUHS(knex, updateArray, task_id, req, res, next);
                        }).catch(function (error) {
                            console.log(error);
                            res.end();
                        });
                    }

                    callbackUHS(knex, updateArray, task_id, req, res, next);
                })
                .catch(function (error) {
                    console.log(error);
                    res.end();
                });
        }
        else res.end();
    };
};