var express = require('express');
var router = express.Router();


router.use('/product',require('./controllers/product/router-product.js'));
router.use('/',require('./controllers/index/router-index.js'));


module.exports=router;