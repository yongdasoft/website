"use strict";
/*
 * 缓存处理。所有用到缓存的入口，也对目标源mongodb,及缓存源redis的中间层。
 * 作者:龙仕云  2015-9-23
 *
 *
 *
 *  var Cache = require('../service/cache.js');
 *  Cache('XXXXX',function(err,obj){});    
 *  Cache.add('BOOK_XXXXX',{selectid:'xxxxxxx'},time); //保存当前的值。 time 可选
 *
 *  Cache.del('xxxx',cb(err){}) 删除key值。
 *
 *  key 的命名方式：
 *   1. 全大写。
 *   2. 在哪定义，在哪使用，不能跨出controllers, 如有特殊请上报统一。
 *   3. key 的格式： controllers_表名_关键字
 *   4. 具体看redis设计.js 文档。
 */

var Redis = require('./redis');


//key 
// cb (err,obj)
var Cache = function(key,cb){
  
  if(cb){
  
    if(!key){
      if(cb) cb(new Error('key 值无效。'));
      return false;  
    };

    //1.先查redis内有没有
    Redis.getjson(key,function(err,obj){

      if(!err && obj){
        if(cb) cb(err,obj);  
      }

      //没有找到，则要到mongodb内查找了。并写入到库内
      else{
        //我怎么查找数据库呢？？
        if(cb) cb(new Error('无缓存数据,'+key)); 
      }
    });
    
  }
  else{
    
    return new Promise(function (resolve, reject) { 
       
      if(!key){
        reject(null);
      };

      //1.先查redis内有没有
      Redis.getjson(key,function(err,obj){

        if(!err && obj){
          resolve(obj);
        }
        //没有找到，则要到mongodb内查找了。并写入到库内
        else{
          //我怎么查找数据库呢？？
          reject(null); 
        }
      }); 
    });
    
  }
};

//清空缓存
//cb(err)
// key 支持通配符＊  例如： *CODE_2343233
Cache.del=function(key,cb){
  Redis.del(key,cb);
};

//增加常量缓存
// expire 为过期时间，单位为秒
//
//增加常量缓存
// expire 为过期时间，单位为秒
// 增加有返回值的回调
//
Cache.add=function(key,obj,expire,cb){
  
  if(typeof expire == 'function'){
    cb = expire;
  };
  
  
  Redis.setjson(key,obj,function(err){
    if(!err){
      if(expire && typeof expire == 'number'){
        Redis.expire(key,expire);      
      };
      if(cb) cb(null);
    }
    else{
      if(cb) cb(err);
    }
  });
};



exports = module.exports  = Cache;
