var fs = require('fs');
var obj = JSON.parse(fs.readFileSync(__dirname + '/models/skills.json', 'utf8'));
var config = require(__dirname + '/config');
var knex = require('knex')(config.get('knex'));
var bookshelf = require('bookshelf')(knex);
var User = bookshelf.Model.extend({
    tableName: 'users',
    constructor: function() {
        bookshelf.Model.apply(this, arguments);
        this.on('saving', function(model, attrs, options) {
            console.log(model, attrs, options)
        });
    }
});
var uuid = require('uuid');
var bcrypt = require('bcryptjs');

//User.forge({
//    id: uuid.v4(),
//    nick: 'vint@vint' + " nick",
//    name: 'vint@vint' + " name",
//    email: 'vint@vint',
//    pswhash: bcrypt.hashSync('111')
//})
//    .save()
//    .then(function(user) {
//        console.log(user);
//    })
//    .catch(function(err) {
//        console.log(err);
//    });

//User
//    .forge()
//    .then(function(model) {
//        //model.set({name:'noob'});
//        console.log(model.get('id'));
//    });
User.forge({
    nick: 'nick1'
}).fetch().then(function(model) {
    model.set({
        id: uuid.v4(),
        nick: 'vint@vint' + " nick",
        name: 'vint@vint' + " name",
        email: 'vint@vint',
        pswhash: bcrypt.hashSync('111')
    }).save().then(function(model) {
        console.log(model);
    });
});
