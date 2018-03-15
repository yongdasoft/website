var express = require('express');
var router = express.Router();


router.use('/product',require('./controllers/product/router-product.js'));
router.use('/about',require('./controllers/about/router-about.js'));
router.use('/',require('./controllers/index/router-index.js'));


module.exports=router;
