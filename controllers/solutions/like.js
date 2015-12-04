
module.exports = function(knex, updateArray) {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            knex('users').where('id', '=', req.user.id).andWhere('solutions_liked', '@>', [req.body.solution_id])
                .then(function (rows) {
                    var notLiked = rows.length === 0; //Чтобы лайк убирался при повторном лайке
                    updateArray('users', 'solutions_liked', req.user.id, notLiked ? 'append' : 'remove', req.body.solution_id)
                        .then(function () {
                        knex('solutions').where('id', '=', req.body.solution_id).increment('likes', notLiked ? 1 : -1).then(function () {
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