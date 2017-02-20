export function commonAction(){
    return {
        listeners:{
            'method':'handleCall'
        },
        handleCall:function(e){
            var detail = e.detail;
            var args = detail.args;
            var callback = detail.callback;

            var methodName = args[0];
            var args = Array.prototype.slice.call(args);
            if(args.length>1)
            args = args.slice(1,args.length);

            var argsText = "";
            var params = [];
            args.map((row,i)=>{
                params.push(row);
                if(i!=0) argsText+=',';
                argsText += `params[${i}]`
            });
        
            callback(eval(`
                if(this.${methodName})
                this.${methodName}(${argsText})
            `));

        }
    }
}

export function dispatchActionBehavior(){
    return {
        dispatchAction:function(){
            return new Promise((reslove,reject)=>{
                this.fire('method',{
                    args:arguments,
                    callback:(promise)=>{
                        if(typeof promise == "undefined"){
                            reslove('Action no promise.');
                        }else{
                            promise.then((res)=>{
                                reslove(promise);
                            }).catch((err)=>{
                                reject(err);
                            })
                        }
                    }
                });
            })
            
        }
    }
}

export const baseURL = `https://${window.location.hostname}:${location.port}`;