var express = require('express');
var router = express.Router();


router.use('/product',require('./controllers/product/router-product.js'));
router.use('/about',require('./controllers/about/router-about.js'));
router.use('/service',require('./controllers/service/router-service.js'));
router.use('/download',require('./controllers/download/router-download.js'));
router.use('/',require('./controllers/index/router-index.js'));


module.exports=router;
