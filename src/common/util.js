"use strict";

var objectid = require('mongodb').ObjectID;
var Uuid = require('uuid');
var http = require('http');
var crypto = require('crypto');
var moment = require('moment');


//
//唯一号
//
exports.uuid=function(){
  return  Uuid.v1();
};


//随机数
var chars = ['0','1','2','3','4','5','6','7','8','9'];
exports.generateMixed=function(n){
   var res = "";
   for(var i = 0; i < n ; i ++) {
       var id = Math.ceil(Math.random()*9);
       res += chars[id];
   };
   return res;
};

//
// 获取文件的扩展名
//
exports.getFileExt = function(file){ 
  var d=/\.[^\.]+$/.exec(file); 
  return d ? d[0] : ''; 
};

//
// 获取除扩展之后的文件名。
// 例如 ss.jpg   返回 ss
exports.getSortFileName=function(file){
  var d=/\.[^\.]+$/.exec(file); 
  return file.replace(d[0], "");
};

//
// 从路径中取出文件名，路径是以 / 分隔的
//
exports.getFileName=function(filepath){
  var url=filepath.split("\\");//这里要将 \ 转义一下
  var str = url[url.length-1];
  
  var url2 = str.split('/');  //有可能是 / 
  var l = url2.length;
  if(l>0){
    return url2[l-1];   
  }
  else
    return str; 
};


//
//字符串转成md5
//
exports.md5 = function (str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
};



/**     
 *
 * 由于date原没有格式化，这个方面可以在ejs内使用到。ejs 是在服务器上运行的。只要在js引擎内增加方法就行。
 *
 * 对Date的扩展，将 Date 转化为指定格式的String     
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符     
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)     
 * eg:     
 * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423     
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04     
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04     
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04     
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18     
 */       
Date.prototype.format=function(fmt) {        
    var o = {        
    "M+" : this.getMonth()+1, //月份        
    "d+" : this.getDate(), //日        
    "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时        
    "H+" : this.getHours(), //小时        
    "m+" : this.getMinutes(), //分        
    "s+" : this.getSeconds(), //秒        
    "q+" : Math.floor((this.getMonth()+3)/3), //季度        
    "S" : this.getMilliseconds() //毫秒        
    };        
    var week = {        
    "0" : "/u65e5",        
    "1" : "/u4e00",        
    "2" : "/u4e8c",        
    "3" : "/u4e09",        
    "4" : "/u56db",        
    "5" : "/u4e94",        
    "6" : "/u516d"       
    };        
    if(/(y+)/.test(fmt)){        
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));        
    }        
    if(/(E+)/.test(fmt)){        
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);        
    }        
    for(var k in o){        
        if(new RegExp("("+ k +")").test(fmt)){        
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));        
        }        
    }        
    return fmt;        
};

Date.prototype.moment = function(){
  return moment(this).locale('zh_cn').utc(8);  
};

/*
 * 转成刚刚，1分钟。
 * fmt 格式见format()方法
 *  small == true 表示简要显示法
 */

Date.prototype.getDiff=function(fmt,small){
  
  var minute = 1000 * 60;
  var hour = minute * 60;
  var day = hour * 24;
  var halfamonth = day * 15;
  var month = day * 30;
  var halfyear = day * 30 * 6;
  var year = day * 30 * 12;  //一年
  
  var myfmt = 'yyyy-MM-dd HH:mm'; 
  var mysmall = small || false; //不是简要写法。
  if(typeof fmt == 'string'){
    var myfmt = fmt ;  
  }
  else if(typeof fmt == 'boolean'){
    mysmall = fmt;  
  };
  
  
  var now = new Date().getTime();
  var diffValue = now - this.valueOf();
  
  if(diffValue < 0){
    return '';
  };
  
  var monthhalfC = diffValue / halfamonth;
  var monthC =diffValue / month;
  var weekC =diffValue / (7*day);
  var dayC =diffValue / day;
  var hourC =diffValue / hour;
  var minC =diffValue / minute;
  
  var yearhalfC = diffValue / halfyear;
  var yearC = diffValue / year;
  
  var myvalue;
  if(mysmall == true && yearC >=1){
    myvalue= parseInt(yearC) + "年前";    
  }
  else if(mysmall == true && yearhalfC>=1){
    myvalue =  "半年前";     
  }
  else if(monthC>=1){
    myvalue = mysmall == true ? parseInt(monthC) + "月前" : this.format(myfmt);
  }
  else if(mysmall == true && monthhalfC>=1){
    myvalue =  "半月前";    
  }else if(weekC>=1){
    myvalue = mysmall == true ? parseInt(weekC) +"周前" : this.format(myfmt);
  }
  else if(dayC>=1){
    myvalue = mysmall == true ?  parseInt(dayC) +"天前" : this.format(myfmt); 
  }
  else if(hourC>=1){
    myvalue = parseInt(hourC) +"小时前";
  }
  else if(minC>=1){
    myvalue = parseInt(minC) +"分钟前";
  }
  else{
    myvalue = "刚刚";
  }
  return myvalue;
};


//
// 将数字转化为文件的大小功能
// 如：book.size.bytestoSize() = 976kb
//
Number.prototype.bytesToSize = function(){
  var bytes = this;
  if (bytes === 0) return '0 B';
  var k = 1000, // or 1024
      sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
};

//
//获取客户网站访问时的ip地址
//
// req 为 expressjs 内的 req
//

exports.getClientIP = function(req){
  var ipAddress;
  var headers = req.headers;
  var forwardedIpsStr = headers['x-forwarded-for'] || headers['x-real-ip']  || headers['Proxy-Client-IP'] || headers['WL-Proxy-Client-IP'];
  forwardedIpsStr ? ipAddress = forwardedIpsStr : ipAddress = null;
  if (!ipAddress) {
    ipAddress = req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket && req.connection.socket.remoteAddress) ;
  }
  return ipAddress;
};

//
//如转入的是字符串说明直接取是ip,否则是req.
//
// cb=function(err,info,ip);
// info={country:'[电信]中国 华东',province:'浙江',city:'杭州'}
//
exports.getClinetIPInfo=function(ip,cb){
  
  var myip;
  if (typeof ip =='object'){
    myip = this.getClientIP(ip);  
  }
  else{
    myip = ip;  
  };
  
  var ipreg =  /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/     
  if(ipreg.test(myip)==false){
    cb && cb(null,{country:'不是有效的ip地址',province:'',city:''},myip);
    return false;
  }; 
  
  var url = 'http://ip.taobao.com/service/getIpInfo.php?ip=' + myip; 
  var mystr = '';
  var req = http.get(url,function(res){
    res.on('data',function(data){mystr += data;});
    res.on('end',function(){
      try{
        var myjson = JSON.parse(mystr);
      }
      catch(e){};
      if(myjson && myjson.code==0){
        
        cb && cb(null,{country:'[' + myjson.data.isp + ']' + myjson.data.country + ' ' + myjson.data.area, 
                       province:myjson.data.region, 
                       city:myjson.data.city},myip);
      }
      else{
        cb && cb(null,{country:'不是有效的ip地址',province:'',city:''},myip);  
      }
    }); 
  }).on('error',function(err){
    cb && cb(err,{country:url,province:'',city:''},myip);
  });
  
  //超时之后处理
  req.setTimeout(3000,function(err){
    req.abort();
    //换别外一家
    var url = 'http://int.dpool.sina.com.cn/iplookup/iplookup.php?format=json&ip='+myip;
    var mystr = '';
    http.get(url,function(res){
      res.on('data',function(data){mystr += data});
      res.on('end',function(){
        var myjson = JSON.parse(mystr);
        cb && cb(null,{country:'[' + myjson.isp + ']' + myjson.country, 
                       province:myjson.province,
                       city:myjson.city},myip);
      });
    }).on('error',function(err){
      cb && cb(err,{country:url,province:'',city:''}, myip);  
    });
  });
};

//
//取出登录时的地理位置
// cb=function(err,info,ip);
// info={country:'',province:'浙江',city:'杭州',rectangle:'',adcode:''}
//
exports.getClientLocation = function(ip,cb){
  var myip;
  if (typeof ip =='object'){
    myip = this.getClientIP(ip);  
  }
  else{
    myip = ip;  
  };
  
  //myip = '122.224.244.74';
  
  var ipreg =  /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/     
  if(ipreg.test(myip)==false){
    cb && cb(null,{country:'不是有效的ip地址',province:'',city:''},myip);
    return false;
  };
  
  // 2016-11-23
  //其中key 为高德上取出来，不同项目不同的值。
  // api 返回的值
  //{
  //  "status" : "1",
  //  "info" : "OK",
  //  "infocode" : "10000",
  //  "province" : "北京市",
  //  "city" : "北京市",
  //  "adcode" : "110000",
  //  "rectangle" : "116.0119343,39.66127144;116.7829835,40.2164962" 
  //}
  var url = 'http://restapi.amap.com/v3/ip?key=7ec8f44d50b04e5f1371ae925370e770&ip=' + myip; 
  var mystr = '';
  var req = http.get(url,function(res){
    res.on('data',function(data){mystr += data;});
    res.on('end',function(){
      try{
        var myjson = JSON.parse(mystr);
      }
      catch(e){};
      if(myjson && myjson.status=='1' && myjson.info =='OK'){
        
        cb && cb(null,{country:'', 
                       province:myjson.province, 
                       city:myjson.city,
                       adcode:myjson.adcode,
                       rectangle:myjson.rectangle},myip);
      }
      else{
        cb && cb(null,{country:'不是有效的ip地址',province:'',city:''},myip);  
      }
    }); 
  }).on('error',function(err){
    cb && cb(err,{country:url,province:'',city:'',rectangle:''},myip);
  });
};

//
// 对象拷贝新的一分
//
exports.clone = function(o){
  return JSON.parse(JSON.stringify(o));
};

//
// 两个数组进行合并，并去重。
// 如两个都是对象要处理的。
//

exports.mergeArray=function (arr1, arr2){ 
  for (var i = 0 ; i < arr1.length ; i ++ ){
      for(var j = 0 ; j < arr2.length ; j ++ ){
       if (arr1[i] === arr2[j]){
         arr1.splice(i,1); //利用splice函数删除元素，从第i个位置，截取长度为1的元素
        }
        //如是对象时处理。
        else if(typeof arr1[i] == 'object' && typeof arr2[j] == 'object' && arr1[i].toString() == arr2[j].toString()) {
          arr1.splice(i,1); 
        };
      }
  };
  //alert(arr1.length)
  for(var i = 0; i <arr2.length; i++){
   arr1.push(arr2[i]);
  };
  
  return arr1;
};







