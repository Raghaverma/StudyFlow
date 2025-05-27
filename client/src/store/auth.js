import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  initialize: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({ user: JSON.parse(user), token });
    }
  },
}));

export default useAuthStore; 