import {createStore,combineReducers} from 'redux';
import PolymerRedux from 'polymer-redux'

import reducerAmount from './amount'

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

const rootReducer = combineReducers({
    app:reducer,
    amount:reducerAmount
});


const store = Redux.createStore(rootReducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
window.ReduxBehavior = PolymerRedux(store);

