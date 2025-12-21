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
import { Event, Groups, People, Add, Refresh } from '@mui/icons-material';
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
    members: { _id: string; name: string; email: string }[];
    staff: { _id: string; name: string; email: string }[];
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
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            User Management
                        </Typography>
                        <Typography color="text.secondary">
                            User management features coming soon. Users can self-register and join conferences using the join code.
                        </Typography>
                    </CardContent>
                </Card>
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
                                            <ListItem key={member._id}>
                                                <ListItemText primary={member.name} secondary={member.email} />
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
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedCommittee(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};
