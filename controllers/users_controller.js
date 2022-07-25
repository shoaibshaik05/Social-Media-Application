const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const AccessToken = require('../models/accessToken');
const resetPasswordMailer = require('../mailers/reset_password_mailer');
const crypto = require('crypto');

// let's keep it same as before
module.exports.profile = function(req, res){
    User.findById(req.params.id, function(err, user){
        return res.render('user_profile', {
            title: 'User Profile',
            profile_user: user
        });
    });

}


module.exports.update = async function(req, res){

    if(req.user.id == req.params.id){

        try{

            let user = await User.findById(req.params.id);
            User.uploadedAvatar(req, res, function(err){
                if(err){
                    console.log('Multer Error', err);
                }

                user.name = req.body.name;
                user.email = req.body.email;

                if(req.file){

                    if(user.avatar){
                        fs.unlinkSync(path.join(__dirname, '..', user.avatar));
                    }
                    //saving path of uploaded file into avatar field in user
                    user.avatar = User.avatarPath + '/' + req.file.filename;
                }

                user.save();
                return res.redirect('back');
            });

        }catch(err){
            req.flash('error', err);
            return res.redirect('back');
        }
    }
    else{
        req.flash('error', 'Unauthorized!');
        return res.status(401).send('Unauthorized');
    }
}


// render the sign up page
module.exports.signUp = function(req, res){
    if (req.isAuthenticated()){
        return res.redirect('/users/profile');
    }


    return res.render('user_sign_up', {
        title: "Codeial | Sign Up"
    })
}


// render the sign in page
module.exports.signIn = function(req, res){

    if (req.isAuthenticated()){
        return res.redirect('/users/profile');
    }
    return res.render('user_sign_in', {
        title: "Codeial | Sign In"
    })
}

// get the sign up data
module.exports.create = function(req, res){
    if (req.body.password != req.body.confirm_password){
        req.flash('error', 'Passwords do not match');
        return res.redirect('back');
    }

    User.findOne({email: req.body.email}, function(err, user){
        if(err){req.flash('error', err); return}

        if (!user){
            User.create(req.body, function(err, user){
                if(err){req.flash('error', err); return}

                return res.redirect('/users/sign-in');
            })
        }else{
            req.flash('success', 'You have signed up, login to continue!');
            return res.redirect('back');
        }

    });
}


// sign in and create a session for the user
module.exports.createSession = function(req, res){
    req.flash('success', 'Logged in Successfully');
    return res.redirect('/');
}

//sign out and clear the session
module.exports.destroySession = function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success', 'You have logged out!');
        res.redirect('/');
      });
}



//for reset password ----------------------------------------------


module.exports.auth = function(request , response){

    return response.render('verify_email' , {
        title: "Codeial | Verify",
    });
}


module.exports.verifyEmail = async function(request , response){


    let user = await User.findOne({email : request.body.email});

    
    if(user){

        let token = await crypto.randomBytes(20).toString("hex");
        let accessToken = await AccessToken.create({
           user : user,
           token :  token,
           isValid : true
        });

        resetPasswordMailer.resetPassword(accessToken);

        return response.render('account_verified' , {
            title: "Codeial | Account Verified",
        });
    }else{
        request.flash("error", "Account does not exist with this email");
        return response.redirect('back');
    }
}

module.exports.resetPassword = async function(request , response){
    
    let accessToken = await AccessToken.findOne({token : request.query.accessToken});
    console.log(accessToken ,'AccessToken' )
    if(accessToken){
        if(accessToken.isValid){
            return response.render('reset_password' , {
                title : 'Codeial | Reset Password',
                accessToken : accessToken.token
            })
        }
    }

    request.flash('error' , 'Token is Expired ! Pls regenerate it.');
    return response.redirect('/auth');
}

module.exports.reset = async function(request , response){
    console.log( request.query)
    let accessToken = await AccessToken.findOne({token : request.query.accessToken});
    console.log(accessToken ,'AccessToken' )
    if(accessToken){
        console.log('AccessToken Present' )
        if(accessToken.isValid){
            console.log('AccessToken is valid' )
            accessToken.isValid = false;
            if(request.body.password == request.body.confirm_password){
                console.log('Password  matchedd' )
                let user = await User.findById(accessToken.user);
                if(user){
                    console.log('User found' , user )
                    user.password = request.body.password;
                    user.confirm_password = request.body.confirm_password;
                    accessToken.save();
                    user.save();
                    console.log('Password changed' , user )
                    request.flash('success' , 'Password Changed');
                    return response.redirect('/users/sign-in');
                }
            }else{
                request.flash('error' , 'Password didnt matched');
                return response.redirect('back');
            }
            
           
        }
    }

    request.flash('error' , 'Token is Expired ! Pls regenerate it.');
    return response.redirect('/auth');
}