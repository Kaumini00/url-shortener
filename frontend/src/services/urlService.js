import api from './authService';

export const urlService = {
  shortenUrl: async (longUrl) => {
    const response = await api.post('/shorten', { longUrl });
    return response.data;
  },

  getUserUrls: async () => {
    const response = await api.get('/links');
    return response.data.urls;
  },
};

export default urlService;