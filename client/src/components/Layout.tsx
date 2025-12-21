import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    Badge,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    Description,
    Message,
    AdminPanelSettings,
    People,
    Logout,
    Event,
    Groups,
    Campaign,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

const DRAWER_WIDTH = 260;

export const Layout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { unreadNoteCount } = useAppStore();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

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

    const getNavItems = () => {
        const baseItems = [
            { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        ];

        if (user?.role === 'delegate') {
            return [
                ...baseItems,
                { text: 'My Directives', icon: <Description />, path: '/delegate' },
            ];
        }

        if (user?.role === 'staff') {
            return [
                ...baseItems,
                { text: 'Directive Queue', icon: <Description />, path: '/staff' },
                { text: 'Announcements', icon: <Campaign />, path: '/staff?tab=announcements' },
                {
                    text: 'Messages',
                    icon: (
                        <Badge badgeContent={unreadNoteCount} color="error">
                            <Message />
                        </Badge>
                    ),
                    path: '/staff?tab=messages'
                },
            ];
        }

        if (user?.role === 'admin') {
            return [
                ...baseItems,
                { text: 'Conferences', icon: <Event />, path: '/admin' },
                { text: 'Committees', icon: <Groups />, path: '/admin?tab=committees' },
                { text: 'Users', icon: <People />, path: '/admin?tab=users' },
            ];
        }

        return baseItems;
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ gap: 2 }}>
                <AdminPanelSettings sx={{ color: 'primary.main', fontSize: 32 }} />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                    OpenCrisis
                </Typography>
            </Toolbar>
            <Divider />
            <List sx={{ flex: 1, py: 2 }}>
                {getNavItems().map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
                        <ListItemButton
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setMobileOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                '&:hover': {
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Role: {user?.role?.toUpperCase()}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    backgroundColor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ flex: 1 }} />

                    <IconButton onClick={handleUserMenuClick} sx={{ p: 0 }}>
                        <Avatar
                            sx={{
                                bgcolor: 'primary.main',
                                width: 36,
                                height: 36,
                                fontSize: '0.9rem',
                            }}
                        >
                            {user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleUserMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.name}</Typography>
                        </MenuItem>
                        <MenuItem disabled>
                            <Typography variant="caption" color="text.secondary">
                                {user?.email}
                            </Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH,
                            backgroundColor: 'background.paper',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: DRAWER_WIDTH,
                            backgroundColor: 'background.paper',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    mt: '64px',
                    minHeight: 'calc(100vh - 64px)',
                    backgroundColor: 'background.default',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};
