import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuthStore } from '../stores/authStore';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            switch (user.role) {
                case 'admin':
                    navigate('/admin', { replace: true });
                    break;
                case 'staff':
                    navigate('/staff', { replace: true });
                    break;
                default:
                    navigate('/delegate', { replace: true });
            }
        }
    }, [user, navigate]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '50vh',
            }}
        >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">
                Redirecting to your dashboard...
            </Typography>
        </Box>
    );
};
