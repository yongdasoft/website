"use strict";

//主页

var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;
var Db = require('../../common/db.js');
var async = require("async");
var crypto = require("crypto");


var get_index = function(req,res,next){
    res.loadview('index.html');
};

var get_yongdalogo = function(req,res,next){    
    res.loadview('logo.html');
};  


router.get('/yongdalogo',get_yongdalogo);
router.get('/',get_index);
module.exports = router;