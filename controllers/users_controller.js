const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const queue = require('../config/kue');
const Friendships = require("../models/friendships");
const userEmailWorker = require('../workers/user_email_worker');
const crypto = require('crypto');

// let's keep it same as before
module.exports.profile = async function(req, res){

try {
   
    let user = await User.findById(req.params.id);
   
    let friendship1,friendship2
   
    friendship1 = await Friendships.findOne({
      from_user: req.user,
      to_user: req.params.id,
    });
   
    friendship2 = await Friendships.findOne({
      from_user: req.params.id,
      to_user: req.user,
    }); 

    let populated_user = await User.findById(req.params.id).populate('friends');    
    return res.render('user_profile', {
        title: 'User Profile',
        profile_user: user,
        populated_user
    });
}
    catch (error) {
        console.log("Error", error);
        return;
    }

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
module.exports.create = function(req, res)
{
    if (req.body.password != req.body.confirm_password){
        return res.redirect('back');
    }

    User.findOne({email: req.body.email}, function(err, user)
    {
        if(err)
        {
            console.log('Error in finding user in signing up'); 
            return;
        }

        if (!user)
        {
            User.create(req.body, function(err, user)
            {
                if(err)
                {
                    console.log('Error in creating user while signing up', err); 
                    return;
                }
                let job = queue.create('signup-successful', user).save(function(err)
                {
                    if(err)
                    {
                        console.log('Error in sending to the queue', err);
                        return;
                    }
                    console.log('Job enqueued', job.id);
                });
                req.flash('success', 'Sign up completed');
                return res.redirect('/users/sign-in');
            });
        }
        else
        {
            req.flash('error', 'Email already exists');
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


module.exports.resetPassword = function(request , response){

    return response.render('verify_email' , {
        title: "Codeial | Verify",
    });
}


module.exports.resetPassMail = function(req, res)
{
    User.findOne({email: req.body.email}, function(err, user)
    {
        if(err)
        {
            console.log('Error in finding user', err);
            return;
        }
        if(user)
        {
            if(user.isTokenValid == false)
            {
                user.accessToken = crypto.randomBytes(30).toString('hex');
                user.isTokenValid = true;
                user.save();
            }

            let job = queue.create('user-emails', user).save(function(err)
            {
                if(err)
                {
                    console.log('Error in sending to the queue', err);
                    return;
                }
                // console.log('Job enqueued', job.id);
            });

            return res.render('account_verified' , {
                title: "Codeial | Verify",
            });
        }
        else
        {
            req.flash('error', 'User not found. Try again!');
            return res.redirect('back');
        }
    });
}

module.exports.setPassword = function(req, res)
{
    User.findOne({accessToken: req.params.accessToken}, function(err, user)
    {
        if(err)
        {
            console.log('Error in finding user', err);
            return;
        }
        if(user.isTokenValid)
        {
            return res.render('reset_password',
            {
                title: 'Codeial | Reset Password',
                access: true,
                accessToken: req.params.accessToken
            });
        }
        else
        {
            req.flash('error', 'Link expired');
            return res.redirect('/users/reset-password');
        }
    });
}

module.exports.updatePassword = function(req, res)
{
    User.findOne({accessToken: req.params.accessToken}, function(err, user)
    {
        if(err)
        {
            console.log('Error in finding user', err);
            return;
        }
        if(user.isTokenValid)
        {
            if(req.body.newPass == req.body.confirmPass)
            {
                user.password = req.body.newPass;
                user.isTokenValid = false;
                user.save();
                req.flash('success', "Password updated. Login now!");
                return res.redirect('/users/sign-in') 
            }
            else
            {
                req.flash('error', "Passwords don't match");
                return res.redirect('back');
            }
        }
        else
        {
            req.flash('error', 'Link expired');
            return res.redirect('/users/reset-password');
        }
    });
}