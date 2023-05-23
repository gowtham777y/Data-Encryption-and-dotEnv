require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const encrypt = require("mongoose-encryption");
const md5 = require("md5");

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
    const password = md5(req.body.password);

    const newUser = new User({
        email: username,
        password: password
    });

    newUser.save();
    res.render("secrets");
})

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}).then(function(user){
        if (user){
            if (user.password === password){
                res.render("secrets");
            }
        }
    }).catch(function(err){
        console.log(err);
    });
})