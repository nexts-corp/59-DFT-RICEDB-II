const initialState = {
    data_list:[
        {nameTH:'ชล',nameEN:'chon'},
        {nameTH:'กิต',nameEN:'kit'}
    ]
}

exports.reducer = function (state = initialState,action){

    switch (action.type) {
        case 'EXPORT_SAVE_NAME':
            const data = state.data_list.slice(0);
            data.push(action.payload)
            return Object.assign({},state,{data_list:data});
        default:
            return state
    }

}

exports.action = function(store){
    return {
        EXPORT_SAVE_NAME:function(name){
            store.dispatch({type:'EXPORT_SAVE_NAME',payload:name})
            
        }
    }
};