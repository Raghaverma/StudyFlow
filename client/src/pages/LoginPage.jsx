import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Avatar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import useAuthStore from '../store/auth';
import authService from '../services/authService';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authService.login(email, password);
      setUser(user, token);
      navigate('/planner');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)',
      background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)',
    }}>
      <Paper elevation={8} sx={{
        p: { xs: 3, sm: 5 },
        borderRadius: 4,
        width: { xs: '90%', sm: 400 },
        maxWidth: 420,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'white',
      }}>
        <Avatar sx={{ bgcolor: 'primary.main', mb: 2, width: 56, height: 56 }}>
          <LockOutlinedIcon fontSize="large" />
        </Avatar>
        <Typography variant="h5" mb={2} fontWeight={700}>Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, py: 1.2, fontWeight: 600, fontSize: '1rem', letterSpacing: 1 }} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'LOGIN'}
          </Button>
        </form>
        <Typography variant="body2" mt={3}>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default LoginPage; 