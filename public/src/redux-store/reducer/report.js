const initialState = {
    data_list:[
        {nameTH:'ชล',nameEN:'chon'},
        {nameTH:'กิต',nameEN:'kit'}
    ]
}

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