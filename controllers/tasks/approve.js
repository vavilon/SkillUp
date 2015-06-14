
var countToApprove = 3, correctConstant = 2 / 3;

module.exports = function(knex, updateArray, pgApprove) {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            knex('tasks').where('id', '=', req.body.task_id).select('is_approved', 'approvement_id').then(function(rows) {
                if (rows[0].is_approved) {
                    res.end();
                    return;
                }
                pgApprove(req.body.task_id, req.body.data, req.user.id, function(err, result) {
                    if (err) {
                        res.end();
                        return console.error('error running query', err);
                    }
                    updateArray('users', 'tasks_approved', req.user.id, 'append', req.body.task_id, function(err, result) {
                        if (err) {
                            res.end();
                            return console.error('error running query', err);
                        }

                        res.end('ok');

                        knex('approvements').where('task_id', '=', req.body.task_id).then(function(rows) {
                            var a = rows[0];
                            var count = 0, tc = 0, tic = 0, sc = 0, sic = 0, dc = 0, dic = 0, lc = 0, lic = 0;

                            if (a.title_correct) tc += a.title_correct.length;
                            if (a.title_incorrect) tic += a.title_incorrect.length;

                            if (a.skills_correct) sc += a.skills_correct.length;
                            if (a.skills_incorrect) sic += a.skills_incorrect.length;

                            if (a.desc_correct) dc += a.desc_correct.length;
                            if (a.desc_incorrect) dic += a.desc_incorrect.length;

                            if (a.links_correct) lc += a.links_correct.length;
                            if (a.links_incorrect) lic += a.links_incorrect.length;

                            count = tc + tic;

                            if (count == countToApprove) {
                                var correct = (tc / count >= correctConstant) && (sc / count >= correctConstant) &&
                                    (dc / count >= correctConstant) && (lc / count >= correctConstant);
                                knex('tasks').where('id', '=', req.body.task_id).update({is_approved: correct}).then(function() {
                                    console.log('Task approved!');
                                }).catch(function (error) {
                                    console.log(error);
                                });
                            }

                        }).catch(function (error) {
                            console.log(error);
                        });
                    });
                });
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        }
        else res.end();
    };
};