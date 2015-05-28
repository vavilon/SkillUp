var passport = require('passport');

module.exports = function(req, res, next) {

    console.log('someone trying to login');

    passport.authenticate('local',
        function(err, user) {
            return err
                ? next(err)
                : user
                    ? req.logIn(user, function(err) {
                        console.log('User with nick "' + user.attributes.nick + '" logged in!');
                        if (err) return next(err);
                        res.header('Access-Control-Allow-Credentials', true);
                        return res.end('/users/' + user.id);
                    })
                    : res.end();
        }
    )(req, res, next);

};