"use strict";

var fs = require('fs');
var ejs = require('ejs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var Config = require('./config.js');
var flash = require('connect-flash');
var serveStatic = require('serve-static');
var util = require('./common/util.js');


var app = express();
module.exports = app;

//
// 版本号
// 2. 2017-7-10 
//
app.locals.appver=4;


app.response.loadview=function(filename,params,ismoble){
  var myismoble;
  var myparams = {};
  var viewstyle = this.viewstyle || '';
      
  if(typeof params ==='boolean'){
      myismoble = params;
  }
  else{
    myparams = params;
    myismoble = ismoble || false; 
  };

  this.render('./' + (viewstyle=='' ? '' : viewstyle + '/')  + filename,myparams); 

};

app.response.msgbox=function(msg,url){
  this.render('./msgbox.html',{msg:msg,url:url?url:'/'}); 
};

//
// 与 loadview 区别是html这个直接采用ejs 进行编译出html 格式，发送到客户端。
// filename 的文件名必经 panel- , dialog- , div-  来开始
//  vcl 控件会用到。
//
app.response.html=function(filename,params){
  var res = this;
  var viewstyle = this.viewstyle || '';
  //1.检查是否有文件
  var myfilename = path.resolve('./html',(viewstyle=='' ? '' : './' + viewstyle + '/') + filename);
  if(fs.existsSync(myfilename)==false){
    res.send('<div class="error">'+ '读取模板文件出错-'+ myfilename  +'</div>');
    return false;  
  };
  
  //2.检查是否有效的文件名
  var verityname = false;
  var beforename =  ['panel-','dialog-','div-'];
  for(var i=0,ii=beforename.length;i<ii;i++){
    if(filename.indexOf(beforename[i]) >=0){
      verityname = true; 
      break;
    };
  };
  
  if(verityname==false){
    res.send('<div class="error">'+ '你的html命名不符合规范('+beforename.toString() +')' +  filename + ' </div>'); 
    return false;
  };
  
  //3.执行解释内容
  fs.readFile(myfilename,function(err,data){
    if(!err){
      var template = ejs.compile(data.toString(),{filename:myfilename});
      //处理参数
      if(!params){params = {};};
      //见router.js 的内容
      params.logininfo = res.locals.logininfo;
      params.appver = app.locals.appver;  
      //end
      res.send(template(params));
    }
    else{
      logger.debug('模板不存在-' + myfilename);
      res.send('<div class="error">'+ '读取模板文件出错-'+ myfilename  +'</div>');
    };
  });  
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public',serveStatic(__dirname + '/public',{ maxAge: 86400000 }));

app.set('views', path.join(__dirname, './html'));
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.set('view cache', Config.viewcache);

app.use(flash());
app.use(session({
  resave:false,
  saveUninitialized:true,
  name:'yongdaapp',
  secret: 'yongda7895123', 
  key: 'yongdaapp', 
  cookie: { secure: false,maxAge: 1000 * 60 * 60 * 24 * 1 }  //1天保存
}));


app.use(require('./router.js'));

if (!Config.debug) {
  app.use(function (err, req, res, next) {
    //认证出错
    if (err.code == 'EBADCSRFTOKEN'){
      logger.error(err);
      res.status(403);
      res.msgbox('页面已篡改(form tampered with)'); 
    }
    else {
      logger.error(err);
      return res.status(500).send('500 status');
    }
  });
};

app.listen(Config.port);

console.log('yongdaapp  stated on port ' + Config.port);