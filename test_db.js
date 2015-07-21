//var fs = require('fs');
//var obj = JSON.parse(fs.readFileSync('skills.json', 'utf8'));
//var uuid = require('uuid');
var bcrypt = require('bcryptjs');
var config = require(__dirname + '/config');
var knex = require('knex')(config.get('knex'));
//var bookshelf = require('bookshelf')(knex);
//var temp;
var uuid = require('uuid');

var skillsProgress = require(__dirname + '/lib/skills-progress')(knex);
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

/*knex.raw("UPDATE solutions SET is_correct = true WHERE id = '248ab5b8-52a7-4a6a-8f25-0927cab2dec4' RETURNING likes, checked_correct, checked_incorrect;")
    .then(function(ans) {
        console.log(ans.rows);
    });*/

skillsProgress.increment('2178d930-0365-4962-89f2-58fbfe28c996',
    '{"(5a0574cc-66b7-4c89-9950-03a2eea0c701,1)","(8b33a559-a0b4-47da-a27e-84439cdecf9c,1)"}',
    [{id: '5a0574cc-66b7-4c89-9950-03a2eea0c701', count: 1}, {id: '8b33a559-a0b4-47da-a27e-84439cdecf9c', count: 1}], function(rows) {
        console.log(rows);
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
