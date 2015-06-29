
var parseSP = require('../../lib/parse-skills-progress');
var userHasSkills = require('../../lib/user-has-skills');

module.exports = function(knex, updateArray){
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (!req.user.attributes.admin) {
                var skills = parseSP(req.user.attributes.skills);
                if (!userHasSkills(skills, req.body.skills)) {
                    res.end();
                    return;
                }
            }

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
                knex('approvements').returning('id').insert({task_id: taskID[0]})
                    .then(function(apprID) {
                        knex('tasks').where('id', '=', taskID[0]).update({approvement_id: apprID[0]})
                            .then(function() {
                                updateArray('users', 'tasks_created', req.user.id, 'append', taskID[0], function (err, result) {
                                    if (err) {
                                        res.end();
                                        return console.error('error running query', err);
                                    }
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
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        } else res.end();
    };
};