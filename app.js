var express = require('express');
var app = express();
var config = require(__dirname + '/config');

app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/front', express.static(__dirname + '/front'));
app.use('/models', express.static(__dirname + '/models'));
app.all('*', function (req, res) {
    res.sendFile(__dirname + '/front/index.html');
});

var server = app.listen(config.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);
});