
module.exports = function(knex, updateArray, userHasSkills){
    function callback (req, res, next) {
        var exp = 0;
        for (var i in req.body.skills) {
            exp += GLOBAL.exs.skills[req.body.skills[i]].exp;
        }

        knex('tasks').returning('id').insert({
            title: req.body.title,
            description: req.body.description,
            skills: req.body.skills,
            exp: exp,
            author: req.user.attributes.id,
            links: req.body.links
        }).then(function (taskID) {
            knex('approvements').insert({task_id: taskID[0]}).then(function() {
                    updateArray('users', 'tasks_created', req.user.id, 'append', taskID[0]).then(function () {
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

    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (!req.user.attributes.admin) {
                knex('skills_progress').where('user_id', '=', req.user.id).select('skill_id as id', 'count')
                    .then(function(userSkills) {
                        if (!userHasSkills(userSkills, req.body.skills)) {
                            res.end();
                            return;
                        }
                        callback(req, res, next);
                    }).catch(function (error) {
                        console.log(error);
                        res.end();
                    });
            }
            else callback(req, res, next);
        } else res.end();
    };
};