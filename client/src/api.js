import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

export const fetchItems = () => api.get('/items').then(r => r.data);
export const fetchList = () => api.get('/list').then(r => r.data);
export const addToList = (grocery_id, price_ils) => api.post('/list', { grocery_id, price_ils }).then(r => r.data);
export const updatePrice = (id, price_ils) => api.patch(`/list/${id}`, { price_ils }).then(r => r.data);
export const removeFromList = (id) => api.delete(`/list/${id}`).then(r => r.data);
