
//Добавить проверку, решал ли пользователь такое задание!!!
module.exports = function(knex, updateArray) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            knex('solutions').returning('id').insert({
                task_id: req.body.task_id,
                user_id: req.user.id,
                content: req.body.content
            }).then(function (id) {

                knex('tasks').where('id', '=', req.body.task_id).select('exp').then(function(rows) {

                    knex.raw("UPDATE users SET tasks_done = array_append(tasks_done, '" + id[0] + "')"
                        + ", exp = exp - " + rows[0].exp  +
                        " WHERE id = '" + req.user.id + "';").then(function() {
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