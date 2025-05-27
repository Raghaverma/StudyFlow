import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/auth';

const register = async (email, password, name) => {
  const res = await axios.post(`${API_URL}/register`, { email, password, name });
  return res.data;
};

const login = async (email, password) => {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  return res.data;
};

const authService = { register, login };
export default authService; 