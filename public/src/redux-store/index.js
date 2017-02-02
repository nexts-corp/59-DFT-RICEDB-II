import {createStore,combineReducers} from 'redux';
import PolymerRedux from 'polymer-redux'

import reportReducer from './reducer/report'
import exportReducer from './reducer/export'

const rootReducer = combineReducers({
    report:reportReducer.reducer,
    export:exportReducer.reducer,
});

const storeApp = createStore(
    rootReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

window.ReduxBehavior = PolymerRedux(storeApp);

window.reportAction = reportReducer.action(storeApp);

