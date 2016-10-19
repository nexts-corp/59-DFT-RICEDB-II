var f1 = function(condition){
  return new Promise(function(resolve,reject){
    if(condition){
      resolve('xx')
    }else{
      reject('xx')
    }

  });
};


var f2 = function(condition){
  return new Promise(function(resolve,reject){
    if(condition){
      resolve('f2')
    }else{
      reject('f2')
    }

  });
};

f1(false).then(function(data){
  console.log('then',data);
  return f2(true);
}).then(function(data){
  console.log('then',data);
}).catch(function(error) {
  console.log('catch',error);
});
