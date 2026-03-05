import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    ListItemIcon,
} from '@mui/material';
import {
    AdminPanelSettings,
    Logout,
    VpnKey,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { ChangePasswordDialog } from './ChangePasswordDialog';

export const Layout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AdminPanelSettings sx={{ color: 'primary.main', fontSize: 32 }} />
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                            OpenCrisis
                        </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="subtitle2" color="text.primary" sx={{ lineHeight: 1.2 }}>
                                {user?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                                {user?.role?.toUpperCase()}
                            </Typography>
                        </Box>

                        <IconButton onClick={handleUserMenuClick} sx={{ p: 0 }}>
                            <Avatar
                                sx={{
                                    bgcolor: 'primary.main',
                                    width: 40,
                                    height: 40,
                                    fontSize: '1rem',
                                }}
                            >
                                {user?.name?.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleUserMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled sx={{ display: { sm: 'none' } }}>
                            <Typography variant="body2">{user?.name}</Typography>
                        </MenuItem>
                        <MenuItem disabled sx={{ display: { sm: 'none' } }}>
                            <Typography variant="caption" color="text.secondary">
                                {user?.role?.toUpperCase()}
                            </Typography>
                        </MenuItem>
                        <MenuItem disabled>
                            <Typography variant="caption" color="text.secondary">
                                {user?.email}
                            </Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => {
                            handleUserMenuClose();
                            setPasswordDialogOpen(true);
                        }}>
                            <ListItemIcon>
                                <VpnKey fontSize="small" />
                            </ListItemIcon>
                            Change Password
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <ChangePasswordDialog
                open={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: '64px',
                    width: '100%',
                    backgroundColor: 'background.default',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};
