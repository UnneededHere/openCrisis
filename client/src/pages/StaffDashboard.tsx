import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Chip,
    List,
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
    Paper,
    Alert,
} from '@mui/material';
import { Assignment, Update, Message, Refresh } from '@mui/icons-material';
import { api } from '../api/client';
import type { DirectiveStatus } from '@opencrisis/shared';

interface Directive {
    _id: string;
    title: string;
    body: string;
    type: string;
    status: DirectiveStatus;
    feedback?: string;
    outcome?: string;
    createdAt: string;
    submittedBy: { _id: string; name: string; email: string };
    committee: { _id: string; name: string };
}

interface Committee {
    _id: string;
    name: string;
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    submitted: 'default',
    in_review: 'info',
    needs_revision: 'warning',
    approved: 'success',
    denied: 'error',
    executed: 'secondary',
};

export const StaffDashboard = () => {
    const queryClient = useQueryClient();

    const [tabValue, setTabValue] = useState(0);
    const [filterCommittee, setFilterCommittee] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedDirective, setSelectedDirective] = useState<Directive | null>(null);
    const [newStatus, setNewStatus] = useState<DirectiveStatus>('submitted');
    const [feedback, setFeedback] = useState('');
    const [outcome, setOutcome] = useState('');
    const [updateTitle, setUpdateTitle] = useState('');
    const [updateBody, setUpdateBody] = useState('');
    const [updateCommittee, setUpdateCommittee] = useState('');

    // Fetch committees
    const { data: committees } = useQuery({
        queryKey: ['committees'],
        queryFn: async () => {
            const response = await api.get('/committees');
            return response.data.data as Committee[];
        },
    });

    // Fetch directives
    const { data: directives, isLoading, refetch } = useQuery({
        queryKey: ['directives', 'queue', filterCommittee, filterStatus],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterCommittee) params.append('committee', filterCommittee);
            if (filterStatus) params.append('status', filterStatus);
            const response = await api.get(`/directives?${params.toString()}`);
            return response.data.data as Directive[];
        },
    });

    // Update status mutation
    const updateStatus = useMutation({
        mutationFn: async ({ id, status, outcome }: { id: string; status: DirectiveStatus; outcome?: string }) => {
            await api.put(`/directives/${id}/status`, { status, outcome });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directives'] });
            setSelectedDirective(null);
        },
    });

    // Add feedback mutation
    const addFeedback = useMutation({
        mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
            await api.put(`/directives/${id}/feedback`, { feedback });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directives'] });
            setFeedback('');
        },
    });

    // Create update mutation
    const createUpdate = useMutation({
        mutationFn: async (data: { title: string; body: string; committee: string }) => {
            await api.post('/updates', { ...data, visibility: 'public' });
        },
        onSuccess: () => {
            setUpdateTitle('');
            setUpdateBody('');
            setUpdateCommittee('');
        },
    });

    const handleDirectiveClick = (directive: Directive) => {
        setSelectedDirective(directive);
        setNewStatus(directive.status);
        setFeedback(directive.feedback || '');
        setOutcome(directive.outcome || '');
    };

    const handleStatusUpdate = () => {
        if (!selectedDirective) return;
        updateStatus.mutate({
            id: selectedDirective._id,
            status: newStatus,
            outcome: outcome || undefined,
        });
    };

    const handleFeedbackSubmit = () => {
        if (!selectedDirective || !feedback.trim()) return;
        addFeedback.mutate({ id: selectedDirective._id, feedback: feedback.trim() });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!updateCommittee || !updateTitle.trim() || !updateBody.trim()) return;
        createUpdate.mutate({
            title: updateTitle.trim(),
            body: updateBody.trim(),
            committee: updateCommittee,
        });
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Staff Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage directives and post crisis updates
            </Typography>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Directive Queue" icon={<Assignment />} iconPosition="start" />
                <Tab label="Post Update" icon={<Update />} iconPosition="start" />
                <Tab label="Notes" icon={<Message />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
                <Grid container spacing={3}>
                    {/* Filters */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Filter by Committee</InputLabel>
                                    <Select
                                        value={filterCommittee}
                                        label="Filter by Committee"
                                        onChange={(e) => setFilterCommittee(e.target.value)}
                                    >
                                        <MenuItem value="">All Committees</MenuItem>
                                        {committees?.map((c) => (
                                            <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Filter by Status</InputLabel>
                                    <Select
                                        value={filterStatus}
                                        label="Filter by Status"
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <MenuItem value="">All Statuses</MenuItem>
                                        <MenuItem value="submitted">Submitted</MenuItem>
                                        <MenuItem value="in_review">In Review</MenuItem>
                                        <MenuItem value="needs_revision">Needs Revision</MenuItem>
                                        <MenuItem value="approved">Approved</MenuItem>
                                        <MenuItem value="denied">Denied</MenuItem>
                                        <MenuItem value="executed">Executed</MenuItem>
                                    </Select>
                                </FormControl>

                                <Button startIcon={<Refresh />} onClick={() => refetch()}>
                                    Refresh
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Directive List */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Directives ({directives?.length || 0})
                                </Typography>

                                {isLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : !directives?.length ? (
                                    <Typography color="text.secondary" textAlign="center" py={4}>
                                        No directives match the current filters
                                    </Typography>
                                ) : (
                                    <List>
                                        {directives.map((directive, index) => (
                                            <Box key={directive._id}>
                                                {index > 0 && <Divider />}
                                                <ListItemButton onClick={() => handleDirectiveClick(directive)}>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography fontWeight={600}>{directive.title}</Typography>
                                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                                    <Chip size="small" label={directive.type} variant="outlined" />
                                                                    <Chip
                                                                        size="small"
                                                                        label={directive.status.replace('_', ' ')}
                                                                        color={statusColors[directive.status]}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    From: {directive.submittedBy.name} • {directive.committee.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {new Date(directive.createdAt).toLocaleString()}
                                                                </Typography>
                                                            </>
                                                        }
                                                    />
                                                </ListItemButton>
                                            </Box>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {tabValue === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Post Crisis Update
                        </Typography>
                        <form onSubmit={handleUpdateSubmit}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Committee</InputLabel>
                                <Select
                                    value={updateCommittee}
                                    label="Committee"
                                    onChange={(e) => setUpdateCommittee(e.target.value)}
                                    required
                                >
                                    {committees?.map((c) => (
                                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Update Title"
                                value={updateTitle}
                                onChange={(e) => setUpdateTitle(e.target.value)}
                                required
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                label="Update Content"
                                value={updateBody}
                                onChange={(e) => setUpdateBody(e.target.value)}
                                required
                                multiline
                                rows={6}
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={createUpdate.isPending}
                                startIcon={<Update />}
                            >
                                {createUpdate.isPending ? 'Posting...' : 'Post Update'}
                            </Button>

                            {createUpdate.isSuccess && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    Update posted successfully!
                                </Alert>
                            )}
                        </form>
                    </CardContent>
                </Card>
            )}

            {tabValue === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Crisis Notes
                        </Typography>
                        <Typography color="text.secondary">
                            Notes and messaging functionality coming soon.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Directive Detail Dialog */}
            <Dialog open={!!selectedDirective} onClose={() => setSelectedDirective(null)} maxWidth="md" fullWidth>
                {selectedDirective && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {selectedDirective.title}
                                <Chip
                                    label={selectedDirective.status.replace('_', ' ')}
                                    color={statusColors[selectedDirective.status]}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                From: {selectedDirective.submittedBy.name} ({selectedDirective.submittedBy.email})
                                <br />
                                Committee: {selectedDirective.committee.name}
                                <br />
                                Type: {selectedDirective.type}
                                <br />
                                Submitted: {new Date(selectedDirective.createdAt).toLocaleString()}
                            </Typography>

                            <Paper sx={{ p: 2, my: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <Typography>{selectedDirective.body}</Typography>
                            </Paper>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Update Status</InputLabel>
                                        <Select
                                            value={newStatus}
                                            label="Update Status"
                                            onChange={(e) => setNewStatus(e.target.value as DirectiveStatus)}
                                        >
                                            <MenuItem value="submitted">Submitted</MenuItem>
                                            <MenuItem value="in_review">In Review</MenuItem>
                                            <MenuItem value="needs_revision">Needs Revision</MenuItem>
                                            <MenuItem value="approved">Approved</MenuItem>
                                            <MenuItem value="denied">Denied</MenuItem>
                                            <MenuItem value="executed">Executed</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        label="Outcome (for approved/executed)"
                                        value={outcome}
                                        onChange={(e) => setOutcome(e.target.value)}
                                        multiline
                                        rows={2}
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        variant="contained"
                                        onClick={handleStatusUpdate}
                                        disabled={updateStatus.isPending}
                                        fullWidth
                                    >
                                        {updateStatus.isPending ? 'Updating...' : 'Update Status'}
                                    </Button>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Private Feedback to Delegate"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        multiline
                                        rows={4}
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        variant="outlined"
                                        onClick={handleFeedbackSubmit}
                                        disabled={addFeedback.isPending || !feedback.trim()}
                                        fullWidth
                                    >
                                        {addFeedback.isPending ? 'Sending...' : 'Send Feedback'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedDirective(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};
