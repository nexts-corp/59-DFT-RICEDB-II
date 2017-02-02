const initialState = {
    year:[]
}


const reducer = (state,action) => {
    if(!state) return initialState; 
    switch (action.type) {

        case 'PULL_YEAR':
            const year = action.payload;
            return Object.assign({},state,{year:year});
        default:
            return state

    }

}


window.CommonActions = {

    actions:{

        pullYear:function(){

            axios.get('./common/year')
            .then((response)=>{
                var quotaYear = response.data.map(item=>{
                    return item.toString();
                });

                ReduxBehavior.dispatch( {
                    type:'PULL_YEAR',
                    payload:quotaYear
                })
                
            })
            .catch((error)=>{
                console.log("error");
            });

        }

    }

}

export default reducer;