var $ = {};


$.get = function(url,callback){
  callback(url);
}

$.get('path/to/api',function(data){
  console.log(data);
});
