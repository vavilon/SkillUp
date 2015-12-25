
module.exports = function(knex) {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            knex('solutions_meta').where('solution_id', req.body.solution_id).andWhere('user_id', req.user.id)
                .select('liked').then(function(rows) {
                    var meta_exists = rows.length > 0;
                    var liked = meta_exists && rows[0].liked;
                    var value = {liked: !liked};

                    var query = knex('solutions_meta');
                    if (meta_exists) query.update(value).where('solution_id', req.body.solution_id).andWhere('user_id', req.user.id);
                    else {
                        value.solution_id = req.body.solution_id;
                        value.user_id = req.user.id;
                        query.insert(value);
                    }
                    query.then(function() {
                        knex('solutions').where('id', req.body.solution_id).increment('likes', liked ? -1 : 1).then(function () {
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
        } else res.end();
    };
};