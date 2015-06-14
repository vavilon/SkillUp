
module.exports = function(knex, updateArray) {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            knex('users').where('id', '=', req.user.id).andWhere('tasks_liked', '@>', [req.body.task_id])
                .then(function (rows) {
                    if (rows.length === 0) {
                        updateArray('users', 'tasks_liked', req.user.id, 'append', req.body.task_id, function (err, result) {
                            if (err) {
                                res.end();
                                return console.error('error running query', err);
                            }
                            knex('tasks').where('id', '=', req.body.task_id).increment('likes', 1).then(function () {
                                res.end('ok');
                            });
                        });
                    }
                    else {
                        updateArray('users', 'tasks_liked', req.user.id, 'remove', req.body.task_id, function (err, result) {
                            if (err) {
                                res.end();
                                return console.error('error running query', err);
                            }
                            knex('tasks').where('id', '=', req.body.task_id).decrement('likes', 1).then(function () {
                                res.end('ok');
                            });
                        });
                    }
                }).catch(function (error) {
                    console.log(error);
                    res.end();
                });
        } else res.end();
    };
};