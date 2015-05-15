var fs = require('fs');
var obj = JSON.parse(fs.readFileSync(__dirname + '/models/skills.json', 'utf8'));
var knex = require('knex')({
  client: 'pg',
  connection: {
    host     : 'localhost',
    user     : 'skillupserv',
    password : '1111',
    database : 'skillup'
  }
});

knex.insert(obj).into('skills').catch(function(error) {
  console.error(error);
});
knex.destroy();