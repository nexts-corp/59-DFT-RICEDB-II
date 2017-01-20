const initialState = {
    list:[]
}


const reducer = (state,action) => {
    if(!state) return initialStateAmount; 
    switch (action.type) {

        case 'AMOUNT_LIST':
            const data = action.payload;
            return Object.assign({},state,{list:data});
        default:
            return state

    }

}

export default reducer;