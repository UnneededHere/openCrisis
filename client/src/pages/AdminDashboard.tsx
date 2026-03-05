import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    CircularProgress,
    Chip,
    Alert,
} from '@mui/material';
import { Event, Groups, People, Add, Refresh, PersonAdd } from '@mui/icons-material';
import { api } from '../api/client';

interface Conference {
    _id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

interface Committee {
    _id: string;
    name: string;
    type: string;
    description?: string;
    conference: { _id: string; name: string };
    members: { user: { _id: string; name: string; email: string }; characterName: string }[];
    staff: { _id: string; name: string; email: string }[];
}

interface UserItem {
    _id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

export const AdminDashboard = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');

    const getTabValue = () => {
        if (tabParam === 'committees') return 1;
        if (tabParam === 'users') return 2;
        return 0;
    };

    const [tabValue, setTabValue] = useState(getTabValue());

    useEffect(() => {
        setTabValue(getTabValue());
    }, [tabParam]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        const newParams = new URLSearchParams(searchParams);
        if (newValue === 0) newParams.delete('tab');
        else if (newValue === 1) newParams.set('tab', 'committees');
        else if (newValue === 2) newParams.set('tab', 'users');
        setSearchParams(newParams);
    };

    // Conference state
    const [conferenceDialogOpen, setConferenceDialogOpen] = useState(false);
    const [newConferenceName, setNewConferenceName] = useState('');
    const [newConferenceDescription, setNewConferenceDescription] = useState('');

    // Committee state
    const [committeeDialogOpen, setCommitteeDialogOpen] = useState(false);
    const [newCommitteeName, setNewCommitteeName] = useState('');
    const [newCommitteeDescription, setNewCommitteeDescription] = useState('');
    const [newCommitteeConference, setNewCommitteeConference] = useState('');
    const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);

    // User state
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<'staff' | 'delegate'>('delegate');
    const [userError, setUserError] = useState('');

    // Assignment state
    const [assignUserId, setAssignUserId] = useState('');
    const [assignRole, setAssignRole] = useState<'member' | 'staff'>('member');
    const [assignCharacterName, setAssignCharacterName] = useState('');
    const [assignError, setAssignError] = useState('');

    // Fetch conferences
    const { data: conferences, isLoading: conferencesLoading, refetch: refetchConferences } = useQuery({
        queryKey: ['conferences'],
        queryFn: async () => {
            const response = await api.get('/conferences');
            return response.data.data as Conference[];
        },
    });

    // Fetch committees
    const { data: committees, isLoading: committeesLoading, refetch: refetchCommittees } = useQuery({
        queryKey: ['committees', 'admin'],
        queryFn: async () => {
            const response = await api.get('/committees');
            return response.data.data as Committee[];
        },
    });

    // Fetch users
    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['users', 'admin'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data.data as UserItem[];
        },
    });

    // Create conference mutation
    const createConference = useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const response = await api.post('/conferences', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conferences'] });
            setConferenceDialogOpen(false);
            setNewConferenceName('');
            setNewConferenceDescription('');
        },
    });

    // Create committee mutation
    const createCommittee = useMutation({
        mutationFn: async (data: { name: string; description?: string; conference: string; type?: string }) => {
            const response = await api.post('/committees', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['committees'] });
            setCommitteeDialogOpen(false);
            setNewCommitteeName('');
            setNewCommitteeDescription('');
            setNewCommitteeConference('');
        },
    });

    // Create user mutation
    const createUser = useMutation({
        mutationFn: async (data: { email: string; password: string; name: string; role: string }) => {
            const response = await api.post('/users', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setUserDialogOpen(false);
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserName('');
            setNewUserRole('delegate');
            setUserError('');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.error?.message || 'Failed to create user';
            setUserError(message);
        },
    });

    // Assign user to committee mutation
    const assignUser = useMutation({
        mutationFn: async (data: { committeeId: string; userId: string; role: 'member' | 'staff'; characterName?: string }) => {
            const response = await api.post(`/committees/${data.committeeId}/assign`, {
                userId: data.userId,
                role: data.role,
                characterName: data.characterName,
            });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['committees'] });
            setAssignUserId('');
            setAssignRole('member');
            setAssignCharacterName('');
            setAssignError('');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.error?.message || 'Failed to assign user';
            setAssignError(message);
        },
    });

    const handleCreateConference = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConferenceName.trim()) return;
        createConference.mutate({
            name: newConferenceName.trim(),
            description: newConferenceDescription.trim() || undefined,
        });
    };

    const handleCreateCommittee = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommitteeName.trim() || !newCommitteeConference) return;
        createCommittee.mutate({
            name: newCommitteeName.trim(),
            description: newCommitteeDescription.trim() || undefined,
            conference: newCommitteeConference,
            type: 'crisis',
        });
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        setUserError('');
        if (!newUserEmail.trim() || !newUserPassword || !newUserName.trim()) return;
        createUser.mutate({
            email: newUserEmail.trim(),
            password: newUserPassword,
            name: newUserName.trim(),
            role: newUserRole,
        });
    };

    const handleAssignUser = (e: React.FormEvent) => {
        e.preventDefault();
        setAssignError('');
        if (!selectedCommittee || !assignUserId) return;
        if (assignRole === 'member' && !assignCharacterName.trim()) {
            setAssignError('Character name is required for members');
            return;
        }
        assignUser.mutate({
            committeeId: selectedCommittee._id,
            userId: assignUserId,
            role: assignRole,
            characterName: assignRole === 'member' ? assignCharacterName.trim() : undefined,
        });
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'error';
            case 'staff': return 'warning';
            case 'delegate': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage conferences, committees, and users
            </Typography>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Conferences" icon={<Event />} iconPosition="start" />
                <Tab label="Committees" icon={<Groups />} iconPosition="start" />
                <Tab label="Users" icon={<People />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                                Conferences ({conferences?.length || 0})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button startIcon={<Refresh />} onClick={() => refetchConferences()}>
                                    Refresh
                                </Button>
                                <Button variant="contained" startIcon={<Add />} onClick={() => setConferenceDialogOpen(true)}>
                                    New Conference
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {conferencesLoading ? (
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        </Grid>
                    ) : (
                        conferences?.map((conference) => (
                            <Grid item xs={12} md={6} lg={4} key={conference._id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h6" fontWeight={600}>
                                                {conference.name}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={conference.isActive ? 'Active' : 'Inactive'}
                                                color={conference.isActive ? 'success' : 'default'}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {conference.description || 'No description'}
                                        </Typography>
                                        <Alert severity="info" sx={{ py: 0 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                Join Code: {conference.code}
                                            </Typography>
                                        </Alert>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                            Created: {new Date(conference.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {tabValue === 1 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                                Committees ({committees?.length || 0})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button startIcon={<Refresh />} onClick={() => refetchCommittees()}>
                                    Refresh
                                </Button>
                                <Button variant="contained" startIcon={<Add />} onClick={() => setCommitteeDialogOpen(true)}>
                                    New Committee
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {committeesLoading ? (
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        </Grid>
                    ) : (
                        <Grid item xs={12}>
                            <Card>
                                <List>
                                    {committees?.map((committee, index) => (
                                        <Box key={committee._id}>
                                            {index > 0 && <Divider />}
                                            <ListItemButton onClick={() => setSelectedCommittee(committee)}>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography fontWeight={600}>{committee.name}</Typography>
                                                            <Chip size="small" label={committee.type} variant="outlined" />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            Conference: {committee.conference?.name}
                                                            <br />
                                                            Members: {committee.members?.length || 0} • Staff: {committee.staff?.length || 0}
                                                        </>
                                                    }
                                                />
                                            </ListItemButton>
                                        </Box>
                                    ))}
                                </List>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            )}

            {tabValue === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                                Users ({users?.length || 0})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button startIcon={<Refresh />} onClick={() => refetchUsers()}>
                                    Refresh
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAdd />}
                                    onClick={() => {
                                        setUserError('');
                                        setUserDialogOpen(true);
                                    }}
                                >
                                    Create User
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {usersLoading ? (
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        </Grid>
                    ) : (
                        <Grid item xs={12}>
                            <Card>
                                <List>
                                    {users?.map((user, index) => (
                                        <Box key={user._id}>
                                            {index > 0 && <Divider />}
                                            <ListItem>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography fontWeight={600}>{user.name}</Typography>
                                                            <Chip
                                                                size="small"
                                                                label={user.role}
                                                                color={getRoleColor(user.role) as any}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            {user.email}
                                                            <br />
                                                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        </Box>
                                    ))}
                                    {!users?.length && (
                                        <ListItem>
                                            <ListItemText
                                                primary={
                                                    <Typography color="text.secondary">
                                                        No users found
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Create Conference Dialog */}
            <Dialog open={conferenceDialogOpen} onClose={() => setConferenceDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleCreateConference}>
                    <DialogTitle>Create New Conference</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Conference Name"
                            value={newConferenceName}
                            onChange={(e) => setNewConferenceName(e.target.value)}
                            required
                            autoFocus
                            sx={{ mt: 1, mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description (optional)"
                            value={newConferenceDescription}
                            onChange={(e) => setNewConferenceDescription(e.target.value)}
                            multiline
                            rows={3}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConferenceDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createConference.isPending}>
                            {createConference.isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Create Committee Dialog */}
            <Dialog open={committeeDialogOpen} onClose={() => setCommitteeDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleCreateCommittee}>
                    <DialogTitle>Create New Committee</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Committee Name"
                            value={newCommitteeName}
                            onChange={(e) => setNewCommitteeName(e.target.value)}
                            required
                            autoFocus
                            sx={{ mt: 1, mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description (optional)"
                            value={newCommitteeDescription}
                            onChange={(e) => setNewCommitteeDescription(e.target.value)}
                            multiline
                            rows={2}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Conference"
                            value={newCommitteeConference}
                            onChange={(e) => setNewCommitteeConference(e.target.value)}
                            required
                            SelectProps={{ native: true }}
                        >
                            <option value="">Select a conference</option>
                            {conferences?.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCommitteeDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createCommittee.isPending}>
                            {createCommittee.isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Committee Detail Dialog */}
            <Dialog open={!!selectedCommittee} onClose={() => setSelectedCommittee(null)} maxWidth="md" fullWidth>
                {selectedCommittee && (
                    <>
                        <DialogTitle>{selectedCommittee.name}</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Conference: {selectedCommittee.conference?.name}
                                <br />
                                Type: {selectedCommittee.type}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Members ({selectedCommittee.members?.length || 0})
                                    </Typography>
                                    <List dense>
                                        {selectedCommittee.members?.map((member) => (
                                            <ListItem key={member.user._id}>
                                                <ListItemText
                                                    primary={`${member.user.name} — ${member.characterName}`}
                                                    secondary={member.user.email}
                                                />
                                            </ListItem>
                                        ))}
                                        {!selectedCommittee.members?.length && (
                                            <Typography variant="body2" color="text.secondary">No members</Typography>
                                        )}
                                    </List>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Staff ({selectedCommittee.staff?.length || 0})
                                    </Typography>
                                    <List dense>
                                        {selectedCommittee.staff?.map((staff) => (
                                            <ListItem key={staff._id}>
                                                <ListItemText primary={staff.name} secondary={staff.email} />
                                            </ListItem>
                                        ))}
                                        {!selectedCommittee.staff?.length && (
                                            <Typography variant="body2" color="text.secondary">No staff assigned</Typography>
                                        )}
                                    </List>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            {/* Assign User Form */}
                            <Typography variant="subtitle2" gutterBottom>
                                Assign User to Committee
                            </Typography>
                            {assignError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {assignError}
                                </Alert>
                            )}
                            <Box component="form" onSubmit={handleAssignUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="User"
                                    value={assignUserId}
                                    onChange={(e) => setAssignUserId(e.target.value)}
                                    required
                                    SelectProps={{ native: true }}
                                    size="small"
                                >
                                    <option value="">Select a user</option>
                                    {users?.map((u) => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth
                                    select
                                    label="Role in Committee"
                                    value={assignRole}
                                    onChange={(e) => setAssignRole(e.target.value as 'member' | 'staff')}
                                    required
                                    SelectProps={{ native: true }}
                                    size="small"
                                >
                                    <option value="member">Member (Delegate)</option>
                                    <option value="staff">Staff (Backroomer)</option>
                                </TextField>
                                {assignRole === 'member' && (
                                    <TextField
                                        fullWidth
                                        label="Character Name"
                                        value={assignCharacterName}
                                        onChange={(e) => setAssignCharacterName(e.target.value)}
                                        required
                                        helperText="The character this delegate will portray"
                                        size="small"
                                    />
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={assignUser.isPending}
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    {assignUser.isPending ? 'Assigning...' : 'Assign User'}
                                </Button>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedCommittee(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleCreateUser}>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogContent>
                        {userError && (
                            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                                {userError}
                            </Alert>
                        )}
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            required
                            autoFocus
                            sx={{ mt: 1, mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            required
                            helperText="Must be at least 8 characters"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Full Name"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Role"
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as 'staff' | 'delegate')}
                            required
                            SelectProps={{ native: true }}
                        >
                            <option value="delegate">Delegate</option>
                            <option value="staff">Staff (Backroomer)</option>
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createUser.isPending}>
                            {createUser.isPending ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};
