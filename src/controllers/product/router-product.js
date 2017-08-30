"use strict";

var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;



router.use(function(req,res,next){
  res.viewstyle  = 'product';
  res.locals.nav = 'product';
  next();
});





router.use('/ppms',require('./ppms.js'));
router.use('/',require('./index.js'));


module.exports = router;