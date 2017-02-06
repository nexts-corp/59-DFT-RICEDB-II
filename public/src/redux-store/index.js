import {createStore,combineReducers} from 'redux';
import PolymerRedux from 'polymer-redux'

import {reportReducer,reportAction} from './reducer/report'
import {importReducer,importAction} from './reducer/import'
//import {exportReducer,exportAction} from './reducer/export'

const rootReducer = combineReducers({
    report:reportReducer,
    import:importReducer
});

const storeApp = createStore(
    rootReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

window.ReduxBehavior = PolymerRedux(storeApp);

window.reportAction = reportAction(storeApp);
window.importAction = importAction(storeApp);