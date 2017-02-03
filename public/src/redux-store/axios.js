import {create} from 'axios'

export default create({
    baseURL:`http://${window.location.hostname}:3000/api`
});