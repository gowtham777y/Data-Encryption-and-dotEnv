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
    password: String
});

// this helps in hashing and salting the password
userSchema.plugin(passportLocalMongoose);

// var secret = process.env.SECRET;
// userSchema.plugin(encrypt,{
//     secret: secret,
//     encryptedFields: ["password"]
// });

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.listen("3000",function(){
    console.log("Server started running on Port 3000");
})

app.get("/secrets",function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
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