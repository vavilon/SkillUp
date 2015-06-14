
var uuid = require('uuid');

module.exports = function(knex, updateArray) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            //Добавить проверку, решал ли пользователь такое задание!!!
            knex('solutions').returning('id').insert({
                task_id: req.body.task_id,
                user_id: req.user.id,
                content: req.body.content
            }).then(function (id) {
                updateArray('users', 'tasks_done', req.user.id, 'append', id[0], function(err, result) {
                    if (err) {
                        res.end();
                        return console.error('error running query', err);
                    }
                    res.end('ok');
                });
            }).catch(function (error) {
                res.end();
            });
        }
        else res.end();
    };
};