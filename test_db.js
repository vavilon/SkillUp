//var fs = require('fs');
//var obj = JSON.parse(fs.readFileSync('skills.json', 'utf8'));
//var uuid = require('uuid');
var bcrypt = require('bcryptjs');
var config = require(__dirname + '/config');
var knex = require('knex')(config.get('knex'));
//var bookshelf = require('bookshelf')(knex);
//var temp;
var uuid = require('uuid');
/*knex('approvements').returning('id').insert({task_id: 'cf133be1-3e14-4678-acce-821684098d79'})
    .then(function(id) {
        console.log(id);
        return;
    });*/

/*    var q = knex.select("tasks.*").from('tasks');
    q.join('users', 'tasks.author', '=', 'users.id').select('users.name as author_name');
    q.limit(10).offset(0);

    q.then(function(rows) {
        console.log(rows);

    }).catch(function (error) {
        console.log(error);
    });*/

knex.raw("UPDATE solutions SET is_correct = true WHERE id = '248ab5b8-52a7-4a6a-8f25-0927cab2dec4' RETURNING likes, checked_correct, checked_incorrect;")
    .then(function(ans) {
        console.log(ans.rows);
    });

/*
var User = bookshelf.Model.extend({
    tableName: 'users',
    defaults: {
        id: temp = uuid.v4(),
        nick: '',
        name: '',
        email: '',
        pswhash: ''
    }
});

new User()
    .save()
    .then(function() {
        new User({'id': temp})
            .set({
                nick: 'nick11',
                name: 'fsdfsadfasdf',
                email: 'sdfasdfadf',
                pswhash: '111'
            })
            .save()
            .then(function(model) {
                console.log(model.get('name'));
            });
    });
*/
