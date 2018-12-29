/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 29-12-18.
 */

var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local');

mongoose.model('User');

passport.use(new LocalStrategy({
    usernameField: 'user[name]',
    passwordField: 'user[password]'
    },
    function(name, password, done){
    User.findOne({ name:name }).then(function(user){
        if(!user || !user.validatePassword(password)) {
            return done(null, false, { errors: { 'email or password': 'is invalid' }});
        }
        return done(null, user);
    }).catch(done);
}));