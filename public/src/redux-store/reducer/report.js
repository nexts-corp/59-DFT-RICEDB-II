const initialState = {
    data_list:[
        {nameTH:'ชล',nameEN:'chon'},
        {nameTH:'กิต',nameEN:'kit'}
    ]
}

exports.reportReducer = function (state = initialState,action){

    switch (action.type) {
        case 'EXPORT_SAVE_NAME':
            const data = state.data_list.slice(0);
            data.push(action.payload)
            return Object.assign({},state,{data_list:data});
        case 'EXPORT_GET_LIST':
            return Object.assign({},state,{data_list:action.payload});
        default:
            return state
    }

}

exports.reportAction = function(store){
    return {
        EXPORT_SAVE_NAME:function(name){
            // axios.get('https://httpbin.org/get').then(()=>{
            //     //store.dispatch({type:'EXPORT_SAVE_NAME',payload:name})'
            //     sucess();
            //     this.EXPORT_GET_LIST();
            // })

            //return axios.get('https://httpbin.org/get');

            return new Promise((resolve,reject)=>{
                axios.get('https://httpbin.org/get').then((res)=>{

                    store.dispatch({type:'EXPORT_SAVE_NAME',payload:name});
                    this.EXPORT_GET_LIST();
                    resolve(res)

                }).catch((error)=>{

                    reject(error)
                    
                });
            });
            
        },
        EXPORT_GET_LIST:function(){
            axios.get('https://httpbin.org/get').then((res)=>{
                store.dispatch({type:'EXPORT_GET_LIST',payload:[{nameTH:'ก',nameEN:'a'}]});
            })
        }
    }
};