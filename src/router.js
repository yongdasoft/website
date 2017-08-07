var express = require('express');
var router = express.Router();


router.use('/',require('./controllers/index/router-index.js'));


module.exports=router;