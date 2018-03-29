"use strict";


var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;
var Db = require('../../common/db.js');
var async = require("async");


var get_index = function(req,res,next){
  res.loadview('/budget3/index.html');
};


router.get('/',get_index);
module.exports = router;