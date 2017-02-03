import {createStore,combineReducers} from 'redux';
import PolymerRedux from 'polymer-redux'

import {reportReducer,reportAction} from './reducer/report'
//import {exportReducer,exportAction} from './reducer/export'

const rootReducer = combineReducers({
    report:reportReducer
});

const storeApp = createStore(
    rootReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

window.ReduxBehavior = PolymerRedux(storeApp);

window.reportAction = reportAction(storeApp);