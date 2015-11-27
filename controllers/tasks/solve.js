
module.exports = function(knex) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.tasks_done && req.user.tasks_done.indexOf(req.body.task_id) !== -1
                || req.user.tasks_created && req.user.tasks_created.indexOf(req.body.task_id) !== -1) {
                res.end();
            }
            else knex('tasks').where('id', '=', req.body.task_id).select('exp', 'is_approved').then(function(rows) {
                if (!rows[0].is_approved) {
                    res.end();
                }
                else knex('solutions').returning('id').insert({
                    task_id: req.body.task_id,
                    user_id: req.user.id,
                    content: req.body.content
                }).then(function (id) {
                    knex.raw("UPDATE users SET tasks_done = array_append(tasks_done, '" + req.body.task_id + "')"
                        + ", exp = exp - " + rows[0].exp  + ", tasks_received = array_remove(tasks_received, '" +
                        req.body.task_id + "')" + " WHERE id = '" + req.user.id + "';").then(function() {
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
        }
        else res.end();
    };
};