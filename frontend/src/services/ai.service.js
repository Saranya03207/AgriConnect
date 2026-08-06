import apiClient from '@/lib/axios';


const BASE = '/ai';







export const aiService = {
  getCropAdvice: (input) =>
  apiClient.post(`${BASE}/crop-advice`, input),

  getByproductIdeas: (input) =>
  apiClient.post(`${BASE}/byproduct-ideas`, input),

  getMarketInsights: (input) =>
  apiClient.post(`${BASE}/market-insights`, input),

  getPricingEstimate: (input) =>
  apiClient.post(`${BASE}/pricing-estimate`, input),

  getHistory: (cursor) =>
  apiClient.get(
    `${BASE}/history`,
    { params: { cursor } }
  )
};