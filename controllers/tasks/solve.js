
var uuid = require('uuid');

module.exports = function(knex, pg, conString) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            //Добавить проверку, решал ли пользователь такое задание!!!
            var id = uuid.v4();
            knex('solutions').insert({
                id: id,
                task_id: req.body.task_id,
                user_id: req.user.id,
                content: req.body.content
            }).then(function () {
                pg.connect(conString, function (err, client, done) {
                    if (err) {
                        return console.error('error fetching client from pool', err);
                    }
                    client.query("UPDATE users SET tasks_done = tasks_done || '{" + id + "}' WHERE id = '" + req.user.id + "';",
                        function (err, result) {
                            done(client);
                            if (err) {
                                return console.error('error running query', err);
                            }
                            res.end('ok');
                        });
                });
            }).catch(function (error) {
                res.end();
            });
        }
        else res.end();
    };
};