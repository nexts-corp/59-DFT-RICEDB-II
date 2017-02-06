import axios from '../axios'

const initState = {
    data_list:[]
}

export function importReducer(state = initState,action){
    switch (action.type){
        case 'IMPORT_GET_LIST':
            return Object.assign({},state,{data_list:action.payload});
        default:
            return state;
    }
}

export function importAction(store){
    return {
        IMPORT_GET_LIST:function(){
           
            var data = [{
                no_book:'พณ012008357',
                import_name:'บุญส่ง สยามแลนด์',
                no_person:'015544099650',
                type_import:'ในโควตา',
                date_start:'14/12/59',
                date_end:'29/12/59'
            }];
            
             return store.dispatch({type:'IMPORT_GET_LIST',payload:data});
        }
    }
}

