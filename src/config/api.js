export const API_BASE_URL = 'http://127.0.0.1:3000'

export const API_ROUTES = {
  CHAT_SESSION: (id) => `${API_BASE_URL}/chat/session/${id}`,
  CONFIG: `${API_BASE_URL}/config`
}