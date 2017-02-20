import {create} from 'axios'
import {baseURL} from './config'

export default create({
    baseURL:baseURL+'/api'
});