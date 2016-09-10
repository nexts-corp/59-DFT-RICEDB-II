var r = require('rethinkdb');

function ConectDB(){
    this.query = function(callback){

        r.connect( {host: 'rdb.codeunbug.com', port: 28015,db: 'gtog'}, function(err, conn) {
            if (err){
                console.log('Error Connect');
            }else{
                console.log('OK');
                callback(conn);
            }
            
        });

    }
}

// var test = new ConectDB();

// test.query(function(conn){
//     r.table('contract').run(conn, function(err,cursor){
//         if(!err){
//             cursor.toArray(function(err,result){
//                 if(!err){
//                     console.log(JSON.stringify(result, null, 2));
//                 }
//             });
//         }
//     });
// })


module.exports = new ConectDB();