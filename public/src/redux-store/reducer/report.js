import axios from '../axios'

const initialState = {
    data_list:[]
}

export function reportReducer(state = initialState,action){

    switch (action.type) {
        // case 'EXPORT_SAVE_NAME':
        //     const data = state.data_list.slice(0);
        //     data.push(action.payload)
        //     return Object.assign({},state,{data_list:data});
        case 'EXPORT_GET_LIST':
            return Object.assign({},state,{data_list:action.payload});
        default:
            return state
    }

}

export function reportAction(store){
    return {
        EXPORT_SAVE_NAME:function(name){
            // axios.get('https://httpbin.org/get').then(()=>{
            //     //store.dispatch({type:'EXPORT_SAVE_NAME',payload:name})'
            //     sucess();
            //     this.EXPORT_GET_LIST();
            // })

            //return axios.get('https://httpbin.org/get');

            return new Promise((resolve,reject)=>{
                axios.post('./new/new',name)
                .then((response)=>{
                    console.log('success!!');
                    console.log(response.data);
                    resolve(response);
                    this.EXPORT_GET_LIST();
                })
                .catch((error)=>{
                    console.log('error');
                    console.log(error);
                    resolve(error);
                });
                // axios.get('./new/new').then((res)=>{

                //     store.dispatch({type:'EXPORT_SAVE_NAME',payload:name});
                //     this.EXPORT_GET_LIST();
                //     resolve(res)

                // }).catch((error)=>{

                //     reject(error)
                    
                // });
            });
            
        },
        EXPORT_EDIT_NAME:function(name){
            return new Promise((resolve,reject)=>{
                axios.put('./new/new',name)
                .then((response)=>{
                    console.log('success!!');
                    console.log(response.data);
                    resolve(response);
                    this.EXPORT_GET_LIST();
                })
                .catch((error)=>{
                    console.log('error');
                    console.log(error);
                    reject(error)
                });
            });
        },
        EXPORT_DELETE_LIST:function(id){
            return new Promise((resolve,reject)=>{
                axios.delete('./new/new?id='+id)
                .then((response)=>{
                    console.log('success!!');
                    console.log(response.data);
                    resolve(response);
                    this.EXPORT_GET_LIST();
                })
                .catch((error)=>{
                    console.log('error');
                    console.log(error);
                    reject(error);
                });
            });
        },
        EXPORT_GET_LIST:function(){
            axios.get('./new/new')
            
            .then((response)=>{
                console.log('success!!');
                console.log(response.data);
                store.dispatch({type:'EXPORT_GET_LIST',payload:response.data});
            })
            .catch((error)=>{
                console.log('error');
                console.log(error);
            });
        }
       
    }
};