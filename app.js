require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 14;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB");

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

// this helps in hashing and salting the password
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// var secret = process.env.SECRET;
// userSchema.plugin(encrypt,{
//     secret: secret,
//     encryptedFields: ["password"]
// });

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
})

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
});

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/submit",function(req,res){
    if (req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.listen("3000",function(){
    console.log("Server started running on Port 3000");
})

app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}}).then(function(foundUsers){
        res.render("secrets",{usersWithSecrets: foundUsers});
    }).catch(function(err){
        console.log(err);
    })
})

app.get("/logout",function(req,res){
    req.logout(function(err){
        if (err){
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id).then(function(user){
        if (user){
            user.secret = submittedSecret;
            user.save().then(function(){
                res.redirect("/secrets");
            }).catch(function(err){
                console.log(err);
            })
        }
    }).catch(function(err){
        console.log(err);
    });
})

app.post("/register",function(req,res){
    // const username = req.body.username;
    // const password = req.body.password;

    // bcrypt.hash(password,saltRounds,function(err,hash){
    //     const newUser = new User({
    //         email: username,
    //         password: hash
    //     });

    //     newUser.save();
    //     res.render("secrets");

    // });

    User.register({username: req.body.username},req.body.password,function(err,user){
        if (err){
            console.log(err);
            res.redirect("/register");
        } else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })

})

app.post("/login",function(req,res){
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username}).then(function(user){
    //     if (user){
    //         bcrypt.compare(password,user.password,function(err,result){
    //             if (result === true){
    //                 res.render("secrets");
    //             }
    //         });
    //     }
    // }).catch(function(err){
    //     console.log(err);
    // });

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user,function(err){
        if (err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
});