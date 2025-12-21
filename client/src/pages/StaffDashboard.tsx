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
    Badge,
} from '@mui/material';
import { Assignment, Campaign, Message, Refresh, Check, Close } from '@mui/icons-material';
import { api } from '../api/client';
import type { DirectiveStatus, DirectiveType, AnnouncementType, AnnouncementPriority } from '@opencrisis/shared';

interface Directive {
    _id: string;
    title: string;
    body: string;
    type: DirectiveType;
    status: DirectiveStatus;
    feedback?: string;
    outcome?: string;
    createdAt: string;
    openedAt?: string;
    processingAt?: string;
    coSigners?: { _id: string; name: string }[];
    submittedBy: { _id: string; name: string; email: string };
    committee: { _id: string; name: string };
}

interface Committee {
    _id: string;
    name: string;
}

interface PendingMessage {
    _id: string;
    content: string;
    from: { _id: string; name: string };
    to: { _id: string; name: string };
    committee: { _id: string; name: string };
    createdAt: string;
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    submitted: 'default',
    opened: 'info',
    processing: 'primary',
    needs_revision: 'warning',
    approved: 'success',
    denied: 'error',
    executed: 'secondary',
};

const typeLabels: Record<DirectiveType, string> = {
    personal: 'Personal',
    joint: 'Joint',
    cabinet: 'Cabinet',
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

    // Announcement state
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementBody, setAnnouncementBody] = useState('');
    const [announcementCommittee, setAnnouncementCommittee] = useState('');
    const [announcementType, setAnnouncementType] = useState<AnnouncementType>('general');
    const [announcementPriority, setAnnouncementPriority] = useState<AnnouncementPriority>('normal');

    // Message moderation state
    const [rejectionReason, setRejectionReason] = useState('');

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

    // Fetch pending messages
    const { data: pendingMessages, refetch: refetchMessages } = useQuery({
        queryKey: ['messages', 'pending'],
        queryFn: async () => {
            const response = await api.get('/messages?status=pending');
            return response.data.data as PendingMessage[];
        },
    });

    // Pending message count
    const { data: pendingCount } = useQuery({
        queryKey: ['messages', 'pending', 'count'],
        queryFn: async () => {
            const response = await api.get('/messages/pending/count');
            return response.data.data.count as number;
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

    // Create announcement mutation
    const createAnnouncement = useMutation({
        mutationFn: async (data: { title: string; body: string; committee: string; type: AnnouncementType; priority: AnnouncementPriority }) => {
            await api.post('/announcements', data);
        },
        onSuccess: () => {
            setAnnouncementTitle('');
            setAnnouncementBody('');
            setAnnouncementType('general');
            setAnnouncementPriority('normal');
        },
    });

    // Moderate message mutation
    const moderateMessage = useMutation({
        mutationFn: async ({ id, action, rejectionReason }: { id: string; action: 'approve' | 'deny'; rejectionReason?: string }) => {
            await api.patch(`/messages/${id}/moderate`, { action, rejectionReason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            setRejectionReason('');
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

    const handleAnnouncementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementCommittee || !announcementTitle.trim() || !announcementBody.trim()) return;
        createAnnouncement.mutate({
            title: announcementTitle.trim(),
            body: announcementBody.trim(),
            committee: announcementCommittee,
            type: announcementType,
            priority: announcementPriority,
        });
    };

    const handleApproveMessage = (id: string) => {
        moderateMessage.mutate({ id, action: 'approve' });
    };

    const handleDenyMessage = (id: string, reason: string) => {
        moderateMessage.mutate({ id, action: 'deny', rejectionReason: reason });
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Staff Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage directives, moderate messages, and post announcements
            </Typography>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Directive Queue" icon={<Assignment />} iconPosition="start" />
                <Tab
                    label="Message Moderation"
                    icon={
                        <Badge badgeContent={pendingCount || 0} color="error">
                            <Message />
                        </Badge>
                    }
                    iconPosition="start"
                />
                <Tab label="Post Announcement" icon={<Campaign />} iconPosition="start" />
            </Tabs>

            {/* Directive Queue Tab */}
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
                                        <MenuItem value="opened">Opened</MenuItem>
                                        <MenuItem value="processing">Processing</MenuItem>
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
                                                                <Box>
                                                                    <Typography fontWeight={600}>{directive.title}</Typography>
                                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                                        <Chip size="small" label={typeLabels[directive.type]} variant="outlined" />
                                                                        {directive.coSigners && directive.coSigners.length > 0 && (
                                                                            <Chip size="small" label={`+${directive.coSigners.length} co-signers`} variant="outlined" />
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                                <Chip
                                                                    size="small"
                                                                    label={directive.status.replace('_', ' ')}
                                                                    color={statusColors[directive.status]}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    From: {directive.submittedBy?.name || 'Unknown'} • {directive.committee?.name || 'Unknown'}
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

            {/* Message Moderation Tab */}
            {tabValue === 1 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Pending Messages ({pendingMessages?.length || 0})
                            </Typography>
                            <Button startIcon={<Refresh />} onClick={() => refetchMessages()}>
                                Refresh
                            </Button>
                        </Box>

                        {!pendingMessages?.length ? (
                            <Typography color="text.secondary" textAlign="center" py={4}>
                                No messages pending approval
                            </Typography>
                        ) : (
                            <List>
                                {pendingMessages.map((msg, index) => (
                                    <Box key={msg._id}>
                                        {index > 0 && <Divider />}
                                        <Paper sx={{ p: 2, my: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle2">
                                                        {msg.from.name} → {msg.to.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {msg.committee.name} • {new Date(msg.createdAt).toLocaleString()}
                                                    </Typography>
                                                    <Paper sx={{ p: 2, mt: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                                        <Typography>{msg.content}</Typography>
                                                    </Paper>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    startIcon={<Check />}
                                                    onClick={() => handleApproveMessage(msg._id)}
                                                    disabled={moderateMessage.isPending}
                                                >
                                                    Approve
                                                </Button>
                                                <TextField
                                                    size="small"
                                                    placeholder="Rejection reason (optional)"
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    sx={{ flex: 1 }}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    startIcon={<Close />}
                                                    onClick={() => handleDenyMessage(msg._id, rejectionReason)}
                                                    disabled={moderateMessage.isPending}
                                                >
                                                    Deny
                                                </Button>
                                            </Box>
                                        </Paper>
                                    </Box>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Post Announcement Tab */}
            {tabValue === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Post Announcement
                        </Typography>
                        <form onSubmit={handleAnnouncementSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Committee</InputLabel>
                                        <Select
                                            value={announcementCommittee}
                                            label="Committee"
                                            onChange={(e) => setAnnouncementCommittee(e.target.value)}
                                            required
                                        >
                                            {committees?.map((c) => (
                                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            value={announcementType}
                                            label="Type"
                                            onChange={(e) => setAnnouncementType(e.target.value as AnnouncementType)}
                                        >
                                            <MenuItem value="general">General</MenuItem>
                                            <MenuItem value="media_notice">Media Notice</MenuItem>
                                            <MenuItem value="breaking_news">Breaking News</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Priority</InputLabel>
                                        <Select
                                            value={announcementPriority}
                                            label="Priority"
                                            onChange={(e) => setAnnouncementPriority(e.target.value as AnnouncementPriority)}
                                        >
                                            <MenuItem value="normal">Normal</MenuItem>
                                            <MenuItem value="high">High</MenuItem>
                                            <MenuItem value="urgent">Urgent</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Announcement Title"
                                        value={announcementTitle}
                                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Announcement Content"
                                        value={announcementBody}
                                        onChange={(e) => setAnnouncementBody(e.target.value)}
                                        required
                                        multiline
                                        rows={6}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={createAnnouncement.isPending}
                                        startIcon={<Campaign />}
                                    >
                                        {createAnnouncement.isPending ? 'Posting...' : 'Post Announcement'}
                                    </Button>

                                    {createAnnouncement.isSuccess && (
                                        <Alert severity="success" sx={{ mt: 2 }}>
                                            Announcement posted successfully!
                                        </Alert>
                                    )}
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Directive Detail Dialog */}
            <Dialog open={!!selectedDirective} onClose={() => setSelectedDirective(null)} maxWidth="md" fullWidth>
                {selectedDirective && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    {selectedDirective.title}
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                        <Chip size="small" label={typeLabels[selectedDirective.type]} variant="outlined" />
                                        {selectedDirective.coSigners && selectedDirective.coSigners.length > 0 && (
                                            <Chip size="small" label={`Co-signers: ${selectedDirective.coSigners.map(c => c.name).join(', ')}`} variant="outlined" color="info" />
                                        )}
                                    </Box>
                                </Box>
                                <Chip
                                    label={selectedDirective.status.replace('_', ' ')}
                                    color={statusColors[selectedDirective.status]}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                From: {selectedDirective.submittedBy?.name || 'Unknown'} ({selectedDirective.submittedBy?.email || 'N/A'})
                                <br />
                                Committee: {selectedDirective.committee?.name || 'Unknown'}
                                <br />
                                Submitted: {new Date(selectedDirective.createdAt).toLocaleString()}
                            </Typography>

                            <Paper sx={{ p: 2, my: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedDirective.body}</Typography>
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
                                            <MenuItem value="opened">Opened</MenuItem>
                                            <MenuItem value="processing">Processing</MenuItem>
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
