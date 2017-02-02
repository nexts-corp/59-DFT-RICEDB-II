const initialState = {a:'foo',b:'bar'}

exports.reducer = function (state = initialState,action){

    switch (action.type) {
        case 'AMOUNT_LIST':
            //const data = action.payload;
            //return Object.assign({},state,{list:data});
        default:
            return state
    }

}

exports.action = function(store){
    return {}
};