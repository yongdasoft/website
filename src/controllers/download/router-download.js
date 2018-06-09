"use strict";

var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;


router.use(function(req,res,next){
  res.viewstyle = 'download';
  res.locals.nav = 'download';
  next();
});


router.use('/',require('./index.js'));


module.exports = router;