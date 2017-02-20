import {createStore,combineReducers} from 'redux'
import PolymerRedux from 'polymer-redux'
import {dispatchActionBehavior} from './config'

import {exampleReducer,exampleAction} from './reducer/example'

const rootReducer = combineReducers({
    example:exampleReducer
});

const storeApp = createStore(
    rootReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

window.ReduxBehavior = PolymerRedux(storeApp);
window.ReduxBehavior = [PolymerRedux(storeApp),dispatchActionBehavior()];

window.exampleAction = exampleAction(storeApp);
