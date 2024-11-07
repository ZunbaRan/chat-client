// export const API_BASE_URL = 'http://192.168.110.99:3000'
export const API_BASE_URL = 'http://127.0.0.1:3000'

export const API_ROUTES = {
  CREATE_SESSION_LIST: `${API_BASE_URL}/chat/sessions`,
  CHAT_SESSION: (id) => `${API_BASE_URL}/chat/session/${id}`,
  CONFIG: `${API_BASE_URL}/config`,
  ADD_AI_TO_SESSION: (sessionId, aiProfileId) => 
    `${API_BASE_URL}/chat/session/${sessionId}/ai/${aiProfileId}`,
  SEND_MESSAGE: (sessionId) => 
    `${API_BASE_URL}/chat/${sessionId}/message`,
  CREATE_SESSION: `${API_BASE_URL}/chat/session`,
  UPDATE_SESSION: (sessionId) => `${API_BASE_URL}/chat/session/${sessionId}`,
  TEST_CHARACTER: (profileId) => `${API_BASE_URL}/config/chat/${profileId}`
}