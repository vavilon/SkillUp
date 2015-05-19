var requireTree = require('require-tree');
var config = requireTree('../../config');
var knex = require('knex')(config.get('knex'));
var bookshelf = require('bookshelf')(knex);
var User = bookshelf.Model.extend({ tableName: 'users' });
var uuid = require('uuid');
var bcrypt = require('bcryptjs');

module.exports = function(req, res, next) {
    new User({
        id: uuid.v4(),
        nick: req.body.email + " nick",
        name: req.body.email + " name",
        email: req.body.email,
        pswhash: bcrypt.hashSync(req.body.password)
    })
        .save()
        .then(function(user) {
            console.log(user);
            req.login(user, function(err) {
                return err
                    ? next(err)
                    : res.redirect('/skills');
            });
        })
        .catch(function(err) {
            next(err);
        });
};