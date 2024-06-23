
require('dotenv').config();
const express = require('express');
const User = require('../models/user');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

router.post("/register", async(req, res) => {

  try{

    const email = req.body.email;
    const password = req.body.password;
    const cnfpassword = req.body.confirm_password;
    if(password != cnfpassword){
        return res.json({error: 'Passwords do not match!'});
    }
    const name = req.body.name;
    if(!email){
      return res.json({error: 'Email is required'});
    }
    if(!password){
      return res.json({error: 'Password is required'});
    }
    if(!name){
      return res.json({error: 'Name is required'});
    }

    const exist = await User.findOne({email:email});
    if(exist) {
      return res.json({
        error: "Email is already in use"
      })
    }

    bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
        const user = User.create({
          name,
          email, 
          password: hash,
        });
        jwt.sign({email: email, id: user._id}, process.env.SECRET_KEY, {}, (err, token) => {
          if(err) throw err;
          res.redirect("/home");
        });
      });
    });
  }
  catch(err){
    console.log(err);
  }
});

router.post('/login', async(req, res, next) => {

  const email = req.body.email;
  const password = req.body.password;

  console.log(email);

  const user = await User.findOne({email: email});
  if(!user){
    return res.json({error: "No user found"});
  }  

  bcrypt.compare(password, user.password, function(err, result) {
    if(err){
      res.json({error: err});
    }
    if(result === true){
      jwt.sign({email: email, id: user._id}, process.env.SECRET_KEY, {
        expiresIn: '1h'
      }, (err, token) => {
        if(err) throw err;
        console.log(token);
        res.redirect("/home");
      });
    }
    else{
      res.json({error: "Wrong Password"});
    }
  });

});
module.exports = router;