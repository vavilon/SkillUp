
module.exports = function(knex, updateArray) {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            knex('users').where('id', '=', req.user.id).andWhere('tasks_liked', '@>', [req.body.task_id])
                .then(function (rows) {
                    var notLiked = rows.length === 0;
                    updateArray('users', 'tasks_liked', req.user.id, notLiked ? 'append' : 'remove', req.body.task_id)
                        .then(function () {
                        knex('tasks').where('id', '=', req.body.task_id).increment('likes', notLiked ? 1 : -1).then(function () {
                            res.end('ok');
                        });
                    }).catch(function (error) {
                            console.log(error);
                            res.end();
                        });
                }).catch(function (error) {
                    console.log(error);
                    res.end();
                });
        } else res.end();
    };
};