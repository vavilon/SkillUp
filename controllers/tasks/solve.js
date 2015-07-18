
module.exports = function(knex) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.attributes.tasks_done && req.user.attributes.tasks_done.indexOf(req.body.task_id) !== -1
                || req.user.attributes.tasks_created && req.user.attributes.tasks_created.indexOf(req.body.task_id) !== -1) {
                res.end();
                return;
            }
            knex('solutions').returning('id').insert({
                task_id: req.body.task_id,
                user_id: req.user.id,
                content: req.body.content
            }).then(function (id) {
                knex('tasks').where('id', '=', req.body.task_id).select('exp').then(function(rows) {
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