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

const rootReducer = Redux.combineReducers({
    app:reducer,
    amount:reducerAmount
});


const store = Redux.createStore(rootReducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
const ReduxBehavior = PolymerRedux(store);


//ReduxBehavior

// properties:{
//               testx:{
//                 type:String,
//                 statePath:'x.testza'
//               }
//             },
//             actions:{
//               change:function(name){
//                 return {
//                   type:'CHANGE_NAME',
//                   name:name,
//                   x:'aaaa'
//                 }
//               }
//             },
//             changeName:function(){
//               this.dispatch('change','ton')
//             },
