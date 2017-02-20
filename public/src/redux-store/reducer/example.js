import axios from '../axios'
import {commonAction} from '../config'

const initialState = {
    list:[
        {fname:'ton',lname:'sai'},
        {fname:'ice',lname:'za'}
    ],
    hello:'world'
}

export function exampleReducer(state = initialState,action){

    switch (action.type) {
        case 'EXAMPLE_INSERT':
            //state.list.push(action.payload);
            // /var list = JSON.parse(JSON.stringify(state.list));

            return Object.assign({},state,{list:list});
        default:
            return state
    }

}

export function exampleAction(store){
    return [commonAction(),{
        EXAMPLE_INSERT:function(params){
            
            axios.post('/x/x',params)
            .catch(err=>{
                var data = params;
                store.dispatch({type:'EXAMPLE_INSERT',payload:data})
            });

        }
    }]
};