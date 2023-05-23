require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 14;

const app = express();
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/usersDB");

const userSchema = mongoose.Schema({
    email: String,
    password: String
});

// var secret = process.env.SECRET;
// userSchema.plugin(encrypt,{
//     secret: secret,
//     encryptedFields: ["password"]
// });

const User = mongoose.model("User",userSchema);

app.set("view engine","ejs");


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

app.post("/register",function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    bcrypt.hash(password,saltRounds,function(err,hash){
        const newUser = new User({
            email: username,
            password: hash
        });

        newUser.save();
        res.render("secrets");

    });
})

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}).then(function(user){
        if (user){
            bcrypt.compare(password,user.password,function(err,result){
                if (result === true){
                    res.render("secrets");
                }
            });
        }
    }).catch(function(err){
        console.log(err);
    });
})