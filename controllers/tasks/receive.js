
module.exports = function(knex, updateArray) {
    return function(req, res, next) {
        knex('users').where('id', '=', req.user.id).andWhere('tasks_received', '@>', [req.body.task_id])
            .then(function(rows) {
                if (rows.length === 0) {
                    updateArray('users', 'tasks_received', req.user.id, 'append', req.body.task_id, function(err, result) {
                        if (err) {
                            res.end();
                            return console.error('error running query', err);
                        }
                        updateArray('tasks', 'participants', req.body.task_id, 'append', req.user.id, function(err, result) {
                            if (err) {
                                res.end();
                                return console.error('error running query', err);
                            }
                            res.end('ok');
                        });
                    });
                }
                else {
                    updateArray('users', 'tasks_received', req.user.id, 'remove', req.body.task_id, function(err, result) {
                        if (err) {
                            res.end();
                            return console.error('error running query', err);
                        }
                        updateArray('tasks', 'participants', req.body.task_id, 'remove', req.user.id, function(err, result) {
                            if (err) {
                                res.end();
                                return console.error('error running query', err);
                            }
                            res.end('ok');
                        });
                    });
                }
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
    };
};