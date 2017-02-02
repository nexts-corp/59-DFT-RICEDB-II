const initialState = {a:'foo',b:'bar'}

exports.exportReducer = function (state = initialState,action){

    switch (action.type) {
        case 'EXPORT_SAVE_NAME':
            //const data = action.payload;
            //return Object.assign({},state,{list:data});
        default:
            return state
    }

}

exports.exportAction = function(store){
    return {
        
    }
};