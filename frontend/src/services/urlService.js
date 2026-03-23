import api from './authService';

export const urlService = {
  shortenUrl: async (longUrl, customAlias) => {
    const body = { longUrl };
    if (customAlias) body.customAlias = customAlias;
    const response = await api.post('/shorten', body);
    return response.data;
  },

  getUserUrls: async () => {
    const response = await api.get('/links');
    return response.data.urls;
  },

  getAnalytics: async (shortCode) => {
    const response = await api.get(`/analytics/${shortCode}`);
    return response.data;
  },
};

export default urlService;
