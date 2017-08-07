"use strict";
//
// mongodb数据库操作功能
// http://mongodb.github.io/node-mongodb-native/2.0/tutorials/crud_operations/
// http://mongodb.github.io/node-mongodb-native/2.0/api/index.html
// 
// 作者：龙仕云 2015-8-25
//
// 回调方法：
//  var xxx = function(err,db)
//
// 修改：
// 1   没有回调则支持Promise 功能。2016-9-18
// 2   增加支持多实例库的情况  2017-1-6 作者：龙仕云
//
var MongoClient = require('mongodb').MongoClient;
var config = require('../config');

var url = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbname;

exports.TABLES = require('./table.js');

var mongo = function(){
  
  //有可能是多个库的连接时，如有平台库 2017-1-6
  this._dbs = [],   //[{url:'xxxx',db:实例}];
    
  this._mongodbUrl= null,
  this._connectOptions={
    server:{
      auto_reconnect: true,
      connectTimeout:5000,
//      poolSize: 10,
      socketOptions:{
        keepAlive: 1
      }
    },
    db: {
      numberOfRetries: 10,
      retryMiliSeconds: 1000
    }
  }
};

mongo.prototype.connect = function(mongodbUrl, callback) {
  var that = this;
  if (!mongodbUrl) {
    if(callback) callback(new Error('missing parameter "mongodbUrl"'));
  } else {
    that._mongodbUrl = mongodbUrl;
    MongoClient.connect(that._mongodbUrl, that._connectOptions, function (err, db) {
      if (err) {
        config.debug==true && console.log(err);
        //that._db = null;
        if(callback) callback(err);
      } else {
        db.on('close', function () {
          config.debug==true && console.log('mongodb server closed');
          for(var i=0,ii=that._dbs.length;i<ii;i++){
            if(that._dbs[i].db == this){
              that._dbs[i].db = null;
              break;
            }  
          };
          
        });
        db.on('timeout', function () {
          config.debug==true && console.log('mongodb server timeout');
          //that._db = null;
          for(var i=0,ii=that._dbs.length;i<ii;i++){
            if(that._dbs[i].db == this ){
              that._dbs[i].db = null;
              break;
            }  
          };
          
        });
        db.on('error', function () {
          config.debug==true && console.log('mongodb server closed');
          //that._db = null;
          
          for(var i=0,ii=that._dbs.length;i<ii;i++){
            if(that._dbs[i].url == mongodbUrl ){
              that._dbs[i].db = null;
              break;
            }  
          };
          
        });
        //that._db = db;
        if(callback) callback(null, db);
      }
    });
  }
};

mongo.prototype.getInstance = function (url,callback) {
  var that = this;
  var curdb = null;
  
  for(var i=0,ii=this._dbs.length;i<ii;i++){
    if(this._dbs[i].url==url){
      curdb = this._dbs[i].db;
      break;
    };
  };
  
  if (!curdb) {
    config.debug==true && console.log('reconnect to mongodb');
    that.connect(url || that._mongodbUrl, function(err, db){
      if (err) {
        if(callback) callback(err);
      } else {
        
        var has = false;
        for(var i=0,ii=that._dbs.length;i<ii;i++){
          if(that._dbs[i].url==url){
            that._dbs[i].db = db; 
            has = true;
            break;
          };
        };
        
        //没有则增加
        if(!has){
          that._dbs.push({url:url,db:db});  
        };
        
        if(callback) callback(null, db);
      }
    });
  } else {
    config.debug==true && console.log('use exists mongodb instance');
    callback(null,curdb);
  }
};


var CurMongo = new mongo();

//
// 打开数据库
//
// aurl = 连接符，如没有则默认。
// cb = function(err ,db) db记得要关闭，db.close()
//
exports.connect = function(aurl,cb){
  if(typeof aurl == 'function'){
    cb = aurl;
    aurl = null;
  };
  var myurl = aurl || url;
  CurMongo.getInstance(myurl, function(err, db) {
    if(cb) cb(err,db);     
  });
};


//
//插入一条记录 
//参数：
// docuemnt : 表名
// record : json 格式的内容,或 [{},{}]
// cb=function(err,result), result: { ok: 1, n: 2 } //n=插入个数
//
exports.insert = function(document,record,cb){
  if(cb){
    CurMongo.getInstance(url, function(err, db) {
      if(!err){
        var collection = db.collection(document);
        collection.insert(record,function(err,result){
          if(cb) cb(err,result,db);      
          //db.close();
        });
      }
      else{
        if(cb) cb(err);  
      }
    });
  }
  else{
    return new Promise(function (resolve, reject) {
      
      CurMongo.getInstance(url, function(err, db) {
        if(!err){
          var collection = db.collection(document);
          collection.insert(record,function(err,result){
            !err ? resolve(result) : reject(err); 
          });
        }
        else{
          reject(err); 
        }
      });
      
    });  
  }
};


//
//查找记录
//
// document 文档
//  where 条件 {phone:'13857121269'}
//  options: {sort:,fields:,skip:,limit:,}
//  cb = function(err,rows,rowcount), 其中rows=[] , rowcount 表示符合条件的总行数
// 
//
exports.find = function(document,where,options,cb){
  
  if( typeof  where == 'function'){
    cb = where;
    where = null;
    options = {};
  } else if (typeof options == 'function'){
    cb = options;
    options = {};
  };
  
  if(cb){
    CurMongo.getInstance(url, function(err, db) {
      if(!err){

        var collection = db.collection(document);

        //有三个参数，说明最后一个要取出行总数。
        if(cb && cb.length==3){
          var cursor = collection.find(where);
          cursor.count(function(err,count){ //取出总数

            //skip:0, limit:6,sort
            if(options.sort) {cursor.sort(options.sort)};
            if(options.skip) {cursor.skip(options.skip)};
            if(options.limit){cursor.limit(options.limit)};

            cursor.toArray(function(err,docs){
              if(!err && docs){
                if(cb) cb(null,docs,count);
                //db.close();
              }
              else{
                if(cb) cb(err); 
                //db.close();
              };

            });
          }); 
        }
        else{
          collection.find(where,options).toArray(function(err,docs){
            if(!err && docs){
              if(cb) cb(null,docs);
              //db.close();
            }
            else{
              if(cb) cb(err); 
              //db.close();
            };
          });

        };
        /*
        var cursor = collection.find(where,options) ; //.sort(sort);
        if(cursor){
          var rows=[];
          cursor.each(function(err, doc) {
           if (doc != null) {
              rows.push(doc);
            } else {
              if(cb) cb(null,rows);
              db.close();
            }
          });
        }
        else{
          if(cb) cb(new Error('库游标空'));
          db.close();
        }
        */
      }
      else{
        if(cb) cb(err);  
      }
    });
  }
  else{
    return new Promise(function (resolve, reject) {
      CurMongo.getInstance(url, function(err, db){
      if(!err){
        var collection = db.collection(document);
        
        //无有三个参数的情况，如要取总数，只能回调方法了。
        collection.find(where,options).toArray(function(err,docs){
          !err ? resolve(docs) : reject(err);
        });
      }
      else{
        reject(err);
      }
    });
    
    })//end promise
  };
};

//
//只查找返回一条记录对象
//
// cb = function(err,row), row 是一个{}
// options {sort:,fields:,skip:,limit:} 选项： 
//

exports.findOne =  function(document,where,options,cb){
  if( typeof  where == 'function'){
    cb = where;
    where = {};
    options = {};
  }
  else if (typeof options == 'function'){
    cb = options;
    options = {};
  };
  
  if(cb){
    CurMongo.getInstance(url, function(err, db) {
      if(!err){
        var collection = db.collection(document);
        collection.findOne(where,options,function(err,doc){
          if(!err && doc){
            if(cb) cb(null,doc);
            //db.close();
          }
          else{
            if (cb) cb(err?err:new Error('没有找到你需要的数据。'));
            //db.close();
          }
        });
      }
      else{
        if(cb) cb(err);  
      }
    }); 
  }
  else{
    return new Promise(function (resolve, reject) {    
      CurMongo.getInstance(url, function(err, db) {
        if(!err){
          var collection = db.collection(document);
          collection.findOne(where,options,function(err,doc){
          if(!err){
            resolve(doc);
          }
          else{
            reject(err?err:new Error('无记录'));
          }
          });
        }
        else{
          reject(err);
        }
      }); 
    });  
  }
};

//
//更新 updateOne
// 
// document : 文档 必填
//  where 条件 必填
//  set 更新的内容 必填 // set = {$inc: {age: 50}, $set: {name: 'hoho'}} 相当于：update users set age = age + 50, name = ‘hoho’
// { $push: { quizzes: { $each: [ { wk: 5, score: 8 },  
//                                { wk: 6, score: 7 },  
//                                { wk: 7, score: 6 } ],  
//                       $sort: { score: -1 },  
//                       $slice: 3,  
//                       $position:2  
//                      }  
//           }  
// } 
//  options 参数选填,例如： {new:true,upsert:true} 
//  cb = function(err,result) 
//     !err && result.result.ok==1 && result.result.n > 0
//     result.upsertedCount > 0 表示更新不到并新增了。 result.upsertedId._id  为新增的_id值.
//
exports.updateOne = function(document,where,set,options,cb){
  
    if(typeof options == 'function'){
      cb = options;
      options = null;
    };
  
  if(cb){
     CurMongo.getInstance(url, function(err, db) {
      if(!err){
        var collection = db.collection(document);
        collection.updateOne(where,set,options,function(err,result){
          if(cb) cb(err,result,db);      
          //db.close();
        });
      }
      else{
        if(cb) cb(err);  
      }
    }); 
  }
  else {
    return new Promise(function (resolve, reject) {
      
      CurMongo.getInstance(url, function(err, db) {
        if(!err){
          var collection = db.collection(document);
          collection.updateOne(where,set,options,function(err,result){
            resolve(result);
          });
        }
        else{
          reject(err)
        }
      }); 
      
      
    })  
  }
};

//
// 多条更新
// 参数与update 一样。
// options 参数选填,例如： {new:true,upsert:upsert}
// set = {$inc: {age: 50}, $set: {name: 'hoho'}} 相当于：update users set age = age + 50, name = ‘hoho’
exports.update = function(document,where,set,options,cb){
  
  if(typeof options == 'function'){
      cb = options;
      options = null;
  };
  
  if(cb){
    
    CurMongo.getInstance(url, function(err, db) {
      if(!err){
        var collection = db.collection(document);
        collection.updateMany(where,set,options,function(err,result){
          cb(err,result);
        });
      }
      else{
        cb(err);  
      }
     }); 
       
  }
  else{
    
    return new Promise(function (resolve, reject) {
      
      CurMongo.getInstance(url, function(err, db) {
      if(!err){
        var collection = db.collection(document);
        collection.updateMany(where,set,options,function(err,result){
          !err? resolve(result) : reject(err);
        });
      }
      else{
        reject(err)  
      }
     }); 
    });
  }
}; 

//
// 删除一条
// where 条件
//
exports.deleteOne = function(document,where,cb){
  
  CurMongo.getInstance(url, function(err, db) {
    if(!err){
      var collection = db.collection(document);
      collection.deleteOne(where,function(err,result){
        if(cb) cb(err,result,db);      
        //db.close();
      });
    }
    else{
      if(cb) cb(err);  
    }
  });
};

//
// 删除多条
//
exports.delete = function(document,where,cb){
  
  CurMongo.getInstance(url, function(err, db) {
    if(!err){
      var collection = db.collection(document);
      collection.deleteMany(where,function(err,result){
        if(cb) cb(err,result,db);      
        //db.close();
      });
    }
    else{
      if(cb) cb(err);  
    }
  });
};

//
// 暂地没有用上 2016-11-4 17:46
// 主要用在一下更新多条项目的开票金额
//
// 查找并修改,(这个好像没有用过)
// set = {$inc: {age: 50}, $set: {name: 'hoho'}} 相当于：update users set age = age + 50, name = ‘hoho’ 
// set = {$set:{name:'xxxxxx'}}
// options 可选参数 options={new:false,upsert:false,fields:{name:1}}
//
//
/*
exports.findAndModify = function(document,where,set,options,cb){
  
  if (typeof options == 'function'){
    cb = options;
    options = {};
  };
  
  CurMongo.getInstance(url, function(err, db) {
    if(!err){
      var collection = db.collection(document);
      //function(query, sort, doc, options, callback)
      collection.findAndModify(where,{},set,options,function(err,doc){
        if(!err && doc){
          doc.result = {ok:doc.ok,n:doc.lastErrorObject?doc.lastErrorObject.n:0} 
         };
         cb(err,doc);
      });

    }
    else{
      if(cb) cb(err);  
    }
  });
  
};

*/

//
// 查找并删除 , 这个可以找到之后有返回值 value 就是删除的对象再做子表的删除动作。
// where 条件 {}
// options : { projection: {b:1}, sort: {a:1} }
// cb(err ,result) result = { value: { a: 1, b: 1, _id: 55fbcdf1963ca0781c87097e },
//                           lastErrorObject: { n: 1 }, ok: 1,result:{ok:1,n:1} }
//
exports.findOneAndDelete = function(document,where,options,cb){
  if(typeof options == 'function'){
      cb = options;
      options = null;
  };
  
  CurMongo.getInstance(url, function(err, db) {
    if(!err){
      var collection = db.collection(document);
      collection.findOneAndDelete(where,options,function(err,result){
        if(cb){
          if(!err && result){
            result.result = {ok:result.ok,n:result.lastErrorObject?result.lastErrorObject.n:0} 
          };
          cb(err,result);
        }
        //db.close();
      });
    }
    else{
      if(cb) cb(err);  
    }
  });
};

//
// 查找一个并修改值，有返回 doc.value 是修改之后的对象
// options 是选项：sort,upsert ,projection:{filed1:1, field2:1} 要返回的列值， 
//                returnOriginal = true 返回原来,false 返回增加的值，默认＝true,
//                returnOriginal:fasle, new:true 则会返回最新的值 
// upsert = true 表示查找不到并增加一个新的，但返回的值 result.value =null 及 lastErrorObject.upserted 为最新的objectid 值。
//                                                                      lastErrorObject.updatedExisting = fasle 表示没有存在是新增的。
// cb(err,doc), doc.value 为原来的值(主要见returnOriginal参数)。 doc.result.ok ==true && doc.result.n > 0

//
exports.findOneAndUpdate = function(document,where,set,options,cb){
  
  if (typeof options == 'function'){
    cb = options;
    options = null;
  };
  
  if(cb){
    CurMongo.getInstance(url, function(err, db) {
      if(!err){
          var collection = db.collection(document);
          collection.findOneAndUpdate(where,set,options,function(err,doc){

            if(!err && doc){
              if(cb){ 
                doc.result = {ok:doc.ok,n:doc.lastErrorObject?doc.lastErrorObject.n:0}  
                cb(err,doc)
              };
              //db.close(); 
            }
            else{
              //db.close(); 
              if(cb) cb(err);
            }
        });
      }
      else{
        if(cb) cb(err);  
    }})
  }
  else {
    return new Promise(function (resolve, reject) { 
      
      CurMongo.getInstance(url, function(err, db) {
      if(!err){
          var collection = db.collection(document);
          collection.findOneAndUpdate(where,set,options,function(err,doc){

            if(!err && doc){
              doc.result = {ok:doc.ok,n:doc.lastErrorObject?doc.lastErrorObject.n:0}  
              resolve(doc)
            }
            else{
              reject(err);
            }
        });
      }
      else{
        if(cb) cb(err);  
    }});
      
      
    });
  }
};

//
// 汇总方法 aggregate
// https://docs.mongodb.com/manual/aggregation/
// 参数：
//  pipeline:[{$match：{}},{$ $group：{}}] 数据组。
//   $project
//   $limit
//   $group：{}
//   更多见:https://docs.mongodb.com/v3.0/reference/operator/aggregation-pipeline/
//   
// cb = function(err,data);
// 
// data 为结果值了：{total:'xx'}, 格式为options 来定
//  例如： options :{_id:"$_id",total:{$sum:"$filesize"}}  , 返回的是 {_id,total} 
//
// 调用方法：
//   Db.aggregate(Db.TABLES.FILES,[$group:{_id:null,total:{$sum:"$size"}}]);
//
exports.aggregate = function(document,pipeline,options,cb){

  if(typeof options == 'function'){
    cb = options;
    options = {};
  };

  if(cb){
    CurMongo.getInstance(url, function(err, db) {
      if(!err){
        var collection = db.collection(document);
        collection.aggregate(pipeline,options,function(err,result){
          if(cb) cb(err,result);  
        });
        
      }
      else{
        if(cb) cb(err);    
      }
    });
  }
  else{
    return new Promise(function (resolve, reject) { 
      
      CurMongo.getInstance(url, function(err, db) {
        if(!err){
          var collection = db.collection(document);
          collection.aggregate(pipeline,options,function(err,result){
          if(!err){
            resolve(result);  
          }
          else{
            reject(null);  
          }
        });
        }
        else{
          reject(null);   
        }
      });
    });  
  }
};

/*
 *
 * { “_id”: 1, “dept”: “A”, “item”: { “sku”: “111”, “color”: “red” }, “sizes”: [ “S”, “M” ] }
 * { “_id”: 2, “dept”: “A”, “item”: { “sku”: “111”, “color”: “blue” }, “sizes”: [ “M”, “L” ] }
 * { “_id”: 3, “dept”: “B”, “item”: { “sku”: “222”, “color”: “blue” }, “sizes”: “S” }
 * { “_id”: 4, “dept”: “A”, “item”: { “sku”: “333”, “color”: “black” }, “sizes”: [ “S” ] }
 *
 *  db.inventory.distinct( “dept” )
 *
 * [ “A”, “B” ]
 *
 * Db.distinct = function('xxx','xxx',cb); 
 *  cb = function(err,objs){}
 *
 */
exports.distinct = function(document,field,cb){
  
  CurMongo.getInstance(url, function(err, db) {
    if(!err){
      var collection = db.collection(document);
      collection.distinct(field,function(err,result){
        if(cb) cb(err,result);  
      });
    }
    else{
      if(cb) cb(err);    
    }
  });
};






