import {createStore,combineReducers} from 'redux';
import PolymerRedux from 'polymer-redux'

import reducerAmount from './reduce/amount'
import reducerCommon from './reduce/common'

const rootReducer = combineReducers({
    common:reducerCommon,
    amount:reducerAmount
});

const storeApp = Redux.createStore(rootReducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
window.ReduxBehavior = PolymerRedux(storeApp);

