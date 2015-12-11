var bcrypt = require('bcryptjs');

module.exports = function (knex) {
    return function (req, res, next) {
        if (!req.isAuthenticated()) return res.end();
        var u = {};
        if (req.body.name) u.name = req.body.name;
        if (req.body.birthday) u.birthday = new Date(req.body.birthday);
        if (req.body.gender) u.gender = req.body.gender;
        if (req.body.country !== undefined) u.country = req.body.country;
        if (req.body.city !== undefined) u.city = req.body.city;
        if (req.body.education !== undefined) u.education = req.body.education;
        if (req.body.work !== undefined) u.work = req.body.work;

        knex('users').where('id', req.user.id).update(u).then(function(){
            res.end('ok');
        }).catch(function (err) {
            console.log(err);
            res.end();
        });
    };
};