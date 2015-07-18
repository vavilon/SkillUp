
module.exports = function(knex, updateArray) {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            knex('users').where('id', '=', req.user.id).andWhere('solutions_liked', '@>', [req.body.solution_id])
                .then(function (rows) {
                    var notLiked = rows.length === 0;
                    updateArray('users', 'solutions_liked', req.user.id, notLiked ? 'append' : 'remove', req.body.solution_id, function (err, result) {
                        if (err) {
                            res.end();
                            return console.error('error running query', err);
                        }
                        knex('solutions').where('id', '=', req.body.solution_id).increment('likes', notLiked ? 1 : -1).then(function () {
                            res.end('ok');
                        });
                    });
                }).catch(function (error) {
                    console.log(error);
                    res.end();
                });
        } else res.end();
    };
};