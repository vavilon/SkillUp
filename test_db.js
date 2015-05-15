var pg = require('pg');

var conString = "postgres://skillupserv:1111@localhost/skillup";

pg.connect(conString, function(err, client, done) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }
  client.query("INSERT INTO skills VALUES (uuid_generate_v4(), 'bla bal', ARRAY[uuid_generate_v4(), uuid_generate_v4()]);",
      function(err, result) {
    //call `done()` to release the client back to the pool
    done(client);

    if(err) {
      return console.error('error running query', err);
    }
    console.log(result);
    //output: 1
  });
});
