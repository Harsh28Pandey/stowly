import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export const errMsg = (e) => e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Please check your connection.' : 'Something went wrong. Please try again.');

export default api;
