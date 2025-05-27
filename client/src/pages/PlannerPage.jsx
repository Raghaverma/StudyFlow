import React from 'react';
import { Typography, Box, Button, Paper, Stack } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AddTaskIcon from '@mui/icons-material/AddTask';

function PlannerPage() {
  // Placeholder for future: open add task modal
  const handleAddTask = () => alert('Add Task feature coming soon!');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
      <Paper elevation={6} sx={{ p: 5, borderRadius: 4, maxWidth: 500, width: '100%', textAlign: 'center', bgcolor: 'white', mb: 4 }}>
        <SchoolIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
          Welcome, Raghav!
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          This is your Smart Study Planner. Organize your tasks, track your habits, and boost your productivity—all in one place.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
          <Button variant="contained" color="primary" size="large" startIcon={<AddTaskIcon />} onClick={handleAddTask} sx={{ fontWeight: 600 }}>
            Add Your First Task
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Need inspiration? Try breaking big assignments into smaller steps, or set a daily study habit!
        </Typography>
      </Paper>
      <Box component="img" src="https://undraw.co/api/illustrations/undraw_studying_re_deca.svg" alt="Study Illustration" sx={{ maxWidth: 400, width: '100%', borderRadius: 3, boxShadow: 3 }} />
    </Box>
  );
}

export default PlannerPage; 