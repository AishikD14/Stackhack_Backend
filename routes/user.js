const router = require('express').Router();
const sha256 = require('sha256');
const nodemailer = require("nodemailer");
var otpGenerator = require('otp-generator');
let User = require('../models/user.model');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mindwebsteam@gmail.com',
        pass: 'zdfczcijuvepcjzs'
    }
});

router.route('/').get((req,res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/login').post((req,res) => {
    const email = req.body.email;
    const password = req.body.password;
    const time = new Date();
    User.find({email: email, password: password})
        .then(users => {
            if(!users.length){
                res.json({"message":'Failure'});
            }
            else{
                users[0].sessionToken = sha256(email + time.toString());
                users[0].save()
                    .then(() => 
                    res.json(
                        {
                            "message":'Success',
                            "token": sha256(email + time.toString())
                        }
                        )
                    )
                    .catch(err => res.status(400).json('Error:' + err));
                
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/get_session').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token })
        .then(user => {
            console.log(user);
            if(user.length === 0){
                res.json({'message': 'Failed'});
            }
            else{
                user[0].lastLoggedIn = new Date()
                user[0].save()
                    .then(() => {
                        res.json(
                            {
                                "username": user[0].username,
                                "profilepic": user[0].profilepic,
                                "lastLoggedIn": user[0].lastLoggedIn
                            })
                    })
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/check_session').post((req,res) => {
    const token = req.body.token;
    User.find({ sessionToken: token })
        .then(user => {
            // console.log(user);
            if(user.length === 0){
                res.json({'message': 'Failed'});
            }
            else{
                res.json({"message": "Success"});
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/request_otp').post((req,res) => {
    const email = req.body.email;
    const otp = otpGenerator.generate(5, { alphabets: false, specialChars: false, upperCase: false });
        
    var mailOptions = {
        from: 'mindwebsteam@gmail.com',
        to: email,
        subject: 'StackHack OTP verification',
        text: 'Your OTP for verification is ' + otp
    };
        
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            res.status(400).json('Error:' + error);
        } else {
            res.json({otp : sha256(otp)});
        }
    });
});

router.route('/register').post((req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    const email = req.body.email;
    const profilepic = req.body.pic;
    const sessionToken = 'NULL';
    const lastLoggedIn = new Date();
    const location = req.body.location;
    const newUser = new User({ username, password, role, email, profilepic, sessionToken, lastLoggedIn, location });

    User.find({email: email})
        .then(users => {
            if(users.length){
                res.json('Email ID Already Exists');
            }
            else{
                console.log(newUser);
                newUser.save()
                    .then(() => res.json('User Saved in Database'))
                    .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/delete').post((req,res) => {
    const token = req.body.token;
    const password = req.body.password;
    
    User.find({sessionToken: token, password: password})
        .then(users => {
            if(!users.length){
                res.json('No Such User Exists');
            }
            else{
                User.deleteOne({sessionToken:token})
                .then(() => res.json('Account deleted'))
                .catch(err => res.status(400).json('Error:' + err));
            }
        })
        .catch(err => res.status(400).json('Error:' + err));
});

router.route('/update_details').post((req,res) => {
    const token = req.body.token;
    User.findOne({sessionToken: token})
    .then(user => {
        user.username = req.body.username;
        user.profilepic = req.body.pic;
        user.location = req.body.location;
        user.save()
            .then(() => res.json('User Details updated'))
            .catch(err => res.status(400).json('Error:' + err));
    })
    .catch(err => res.status(400).json('Error:' + err));
});

router.route('/change_password').post((req,res) => {
    const token = req.body.token;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    User.findOne({sessionToken: token, password: oldPassword})
    .then(user => {
        if(!user){
            res.json({"message" : "Failure"});
        }
        else{
            user.password = newPassword;
            user.save()
                .then(() => res.json('Password updated'))
                .catch(err => res.status(400).json('Error:' + err));
        }
    })
    .catch(err => res.status(400).json('Error:' + err));
});

module.exports = router;