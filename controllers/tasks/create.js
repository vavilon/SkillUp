
var parseSP = require('../../lib/parse-skills-progress');

module.exports = function(knex){
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            if (!req.user.attributes.admin) {
                var skills = parseSP(req.user.attributes.skills);
                var found = false;
                var i = null, j = null;
                var temp = null;
                for (i in req.body.skills) {
                    found = false;
                    for (j in skills) {
                        if (req.body.skills[i] == skills[j].id) {
                            temp = skills[j];
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        if (temp.count < GLOBAL.exs.skills[req.body.skills[i]].count_to_get) {
                            console.log('Not enough level of skill!');
                            res.end();
                            return;
                        }
                    }
                    else {
                        console.log('User doesnt have those skill!');
                        res.end();
                        return;
                    }
                }
            }

            var exp = 0;
            for (i in req.body.skills) {
                exp += GLOBAL.exs.skills[req.body.skills[i]].exp;
            }

            knex('tasks').insert({
                title: req.body.title,
                description: req.body.description,
                skills: req.body.skills,
                exp: exp,
                author: req.user.attributes.id,
                links: req.body.links
            }).then(function () {
                
                res.end('ok');
            }).catch(function (error) {
                res.end();
            });
        } else res.end();
    };
};