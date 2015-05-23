var passport = require('passport');

module.exports = function(req, res, next) {

    console.log('someone trying to login');

    passport.authenticate('local',
        function(err, user) {
            return err
                ? next(err)
                : user
                    ? req.logIn(user, function(err) {
                        return err
                            ? next(err)
                            : res.end('/users/1');
                    })
                    : res.end('/main');
        }
    )(req, res, next);

};