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
    ListItem,
    ListItemText,
    Divider,
    Alert,
    CircularProgress,
    Paper,
    Tabs,
    Tab,
    Checkbox,
    FormGroup,
    FormControlLabel,
    Tooltip,
} from '@mui/material';
import { Send, Description, Refresh, Visibility, Schedule, Reply, Message, Campaign } from '@mui/icons-material';
import { extractErrorMessage } from '../utils/error';
import { api } from '../api/client';
import { useAppStore } from '../stores/appStore';
import type { DirectiveType, DirectiveStatus, AnnouncementType } from '@opencrisis/shared';

interface CommitteeMemberPopulated {
    user: { _id: string; name: string; email: string };
    characterName: string;
}

interface Committee {
    _id: string;
    name: string;
    type: string;
    members: CommitteeMemberPopulated[];
    conference: { _id: string; name: string };
}

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
    repliedAt?: string;
    coSigners?: { _id: string; name: string }[];
    committee: { _id: string; name: string };
}

interface DelegateMessage {
    _id: string;
    content: string;
    status: 'pending' | 'approved' | 'denied';
    from: { _id: string; name: string };
    to: { _id: string; name: string };
    createdAt: string;
    readAt?: string;
    rejectionReason?: string;
}

interface Announcement {
    _id: string;
    title: string;
    body: string;
    type: AnnouncementType;
    priority: 'normal' | 'high' | 'urgent';
    postedBy: { _id: string; name: string };
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

const priorityColors: Record<string, string> = {
    normal: 'rgba(255,255,255,0.1)',
    high: 'rgba(251, 191, 36, 0.15)',
    urgent: 'rgba(239, 68, 68, 0.15)',
};

export const DelegateDashboard = () => {
    const queryClient = useQueryClient();
    const { realtimeDirectives } = useAppStore();

    const [tabValue, setTabValue] = useState(0);
    const [selectedCommittee, setSelectedCommittee] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState<DirectiveType>('personal');
    const [selectedCoSigners, setSelectedCoSigners] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Message state
    const [messageRecipient, setMessageRecipient] = useState('');
    const [messageContent, setMessageContent] = useState('');

    // Fetch committees with members
    const { data: committees, isLoading: committeesLoading } = useQuery({
        queryKey: ['committees'],
        queryFn: async () => {
            const response = await api.get('/committees');
            return response.data.data as Committee[];
        },
    });

    // Fetch my directives
    const { data: directives, isLoading: directivesLoading, refetch } = useQuery({
        queryKey: ['directives', 'my'],
        queryFn: async () => {
            const response = await api.get('/directives');
            return response.data.data as Directive[];
        },
    });

    // Fetch my messages
    const { data: messages, refetch: refetchMessages } = useQuery({
        queryKey: ['messages'],
        queryFn: async () => {
            const response = await api.get('/messages');
            return response.data.data as DelegateMessage[];
        },
    });

    // Fetch announcements
    const { data: announcements, refetch: refetchAnnouncements } = useQuery({
        queryKey: ['announcements', selectedCommittee],
        queryFn: async () => {
            if (!selectedCommittee) return [];
            const response = await api.get(`/announcements?committee=${selectedCommittee}`);
            return response.data.data as Announcement[];
        },
        enabled: !!selectedCommittee,
    });

    // Create directive mutation
    const createDirective = useMutation({
        mutationFn: async (data: { title: string; body: string; type: DirectiveType; committee: string; coSigners?: string[] }) => {
            const response = await api.post('/directives', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directives'] });
            setTitle('');
            setBody('');
            setType('personal');
            setSelectedCoSigners([]);
            setSuccessMessage('Directive submitted successfully!');
            setErrorMessage('');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error) => {
            const msg = extractErrorMessage(error);
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(''), 8000);
        },
    });

    // Send message mutation
    const sendMessage = useMutation({
        mutationFn: async (data: { to: string; committee: string; content: string }) => {
            const response = await api.post('/messages', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            setMessageRecipient('');
            setMessageContent('');
            setSuccessMessage('Message sent for approval!');
            setErrorMessage('');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error) => {
            const msg = extractErrorMessage(error);
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(''), 8000);
        },
    });

    const handleSubmitDirective = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCommittee || !title.trim() || !body.trim()) return;

        createDirective.mutate({
            title: title.trim(),
            body: body.trim(),
            type,
            committee: selectedCommittee,
            coSigners: type === 'joint' ? selectedCoSigners : undefined,
        });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCommittee || !messageRecipient || !messageContent.trim()) return;

        sendMessage.mutate({
            to: messageRecipient,
            committee: selectedCommittee,
            content: messageContent.trim(),
        });
    };

    const handleCoSignerToggle = (userId: string) => {
        setSelectedCoSigners(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Get committee members for co-signer selection (with character names)
    const currentCommittee = committees?.find(c => c._id === selectedCommittee);
    const availableMembers = currentCommittee?.members || [];

    // Combine fetched directives with real-time ones
    const allDirectives = [...realtimeDirectives, ...(directives || [])].filter(
        (d, i, arr) => arr.findIndex((x) => x._id === d._id) === i
    );

    const renderStatusIndicator = (directive: Directive) => (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
            <Tooltip title={directive.openedAt ? `Opened ${new Date(directive.openedAt).toLocaleString()}` : 'Not yet opened'}>
                <Visibility sx={{ fontSize: 16, color: directive.openedAt ? 'success.main' : 'text.disabled' }} />
            </Tooltip>
            <Tooltip title={directive.processingAt ? `Processing since ${new Date(directive.processingAt).toLocaleString()}` : 'Not yet processing'}>
                <Schedule sx={{ fontSize: 16, color: directive.processingAt ? 'info.main' : 'text.disabled' }} />
            </Tooltip>
            <Tooltip title={directive.repliedAt ? `Replied ${new Date(directive.repliedAt).toLocaleString()}` : 'No reply yet'}>
                <Reply sx={{ fontSize: 16, color: directive.repliedAt ? 'primary.main' : 'text.disabled' }} />
            </Tooltip>
        </Box>
    );

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Delegate Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Submit directives, send messages, and view announcements
            </Typography>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Directives" icon={<Description />} iconPosition="start" />
                <Tab label="Messages" icon={<Message />} iconPosition="start" />
                <Tab label="Announcements" icon={<Campaign />} iconPosition="start" />
            </Tabs>

            {/* Directives Tab */}
            {tabValue === 0 && (
                <Grid container spacing={3}>
                    {/* Directive Form */}
                    <Grid item xs={12} lg={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Send /> Submit Directive
                                </Typography>

                                {successMessage && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        {successMessage}
                                    </Alert>
                                )}

                                {errorMessage && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {errorMessage}
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmitDirective}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel id="committee-label">Committee</InputLabel>
                                        <Select
                                            labelId="committee-label"
                                            value={selectedCommittee}
                                            label="Committee"
                                            onChange={(e) => {
                                                setSelectedCommittee(e.target.value);
                                                setSelectedCoSigners([]);
                                            }}
                                            required
                                        >
                                            {committeesLoading ? (
                                                <MenuItem disabled>Loading...</MenuItem>
                                            ) : (
                                                committees?.map((c) => (
                                                    <MenuItem key={c._id} value={c._id}>
                                                        {c.name}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        label="Directive Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        sx={{ mb: 2 }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Directive Body"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        required
                                        multiline
                                        rows={4}
                                        sx={{ mb: 2 }}
                                        helperText="Describe your directive action in detail"
                                    />

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel id="type-label">Directive Type</InputLabel>
                                        <Select
                                            labelId="type-label"
                                            value={type}
                                            label="Directive Type"
                                            onChange={(e) => setType(e.target.value as DirectiveType)}
                                        >
                                            <MenuItem value="personal">Personal - Just between you and staff</MenuItem>
                                            <MenuItem value="joint">Joint - Include other characters</MenuItem>
                                            <MenuItem value="cabinet">Cabinet - On behalf of entire committee</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {/* Co-signer selection for joint directives */}
                                    {type === 'joint' && selectedCommittee && (
                                        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Select Co-signers
                                            </Typography>
                                            <FormGroup>
                                                {availableMembers.length === 0 ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No other members found in this committee
                                                    </Typography>
                                                ) : (
                                                    availableMembers.map((member) => (
                                                        <FormControlLabel
                                                            key={member.user._id}
                                                            control={
                                                                <Checkbox
                                                                    checked={selectedCoSigners.includes(member.user._id)}
                                                                    onChange={() => handleCoSignerToggle(member.user._id)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={member.characterName}
                                                        />
                                                    ))
                                                )}
                                            </FormGroup>
                                            {selectedCoSigners.length > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {selectedCoSigners.length} co-signer(s) selected
                                                </Typography>
                                            )}
                                        </Paper>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        disabled={createDirective.isPending || (type === 'joint' && selectedCoSigners.length === 0)}
                                        startIcon={<Send />}
                                    >
                                        {createDirective.isPending ? 'Submitting...' : 'Submit Directive'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* My Submissions */}
                    <Grid item xs={12} lg={6}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Description /> My Submissions
                                    </Typography>
                                    <Button size="small" startIcon={<Refresh />} onClick={() => refetch()}>
                                        Refresh
                                    </Button>
                                </Box>

                                {directivesLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : allDirectives.length === 0 ? (
                                    <Typography color="text.secondary" textAlign="center" py={4}>
                                        No directives submitted yet
                                    </Typography>
                                ) : (
                                    <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                                        {allDirectives.map((directive, index) => (
                                            <Box key={directive._id}>
                                                {index > 0 && <Divider />}
                                                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                                                <Box>
                                                                    <Typography fontWeight={600}>{directive.title}</Typography>
                                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                                        <Chip size="small" label={typeLabels[directive.type]} variant="outlined" />
                                                                        {directive.coSigners && directive.coSigners.length > 0 && (
                                                                            <Chip size="small" label={`+${directive.coSigners.length} co-signers`} variant="outlined" color="info" />
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
                                                            <Box sx={{ mt: 1 }}>
                                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                    {directive.body.length > 100 ? directive.body.slice(0, 100) + '...' : directive.body}
                                                                </Typography>

                                                                {/* Status indicators */}
                                                                {renderStatusIndicator(directive)}

                                                                {directive.feedback && (
                                                                    <Paper sx={{ p: 1.5, mt: 1, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                                                                        <Typography variant="caption" fontWeight={600}>Staff Feedback:</Typography>
                                                                        <Typography variant="body2">{directive.feedback}</Typography>
                                                                    </Paper>
                                                                )}
                                                                {directive.outcome && (
                                                                    <Paper sx={{ p: 1.5, mt: 1, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                                                                        <Typography variant="caption" fontWeight={600}>Outcome:</Typography>
                                                                        <Typography variant="body2">{directive.outcome}</Typography>
                                                                    </Paper>
                                                                )}
                                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                                    {new Date(directive.createdAt).toLocaleString()}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            </Box>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Messages Tab */}
            {tabValue === 1 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <Message sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Send Message
                                </Typography>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    All messages must be approved by staff before delivery
                                </Alert>
                                <form onSubmit={handleSendMessage}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Committee</InputLabel>
                                        <Select
                                            value={selectedCommittee}
                                            label="Committee"
                                            onChange={(e) => setSelectedCommittee(e.target.value)}
                                            required
                                        >
                                            {committees?.map((c) => (
                                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Recipient</InputLabel>
                                        <Select
                                            value={messageRecipient}
                                            label="Recipient"
                                            onChange={(e) => setMessageRecipient(e.target.value)}
                                            required
                                            disabled={!selectedCommittee}
                                        >
                                            {currentCommittee?.members?.map((m) => (
                                                <MenuItem key={m.user._id} value={m.user._id}>{m.characterName}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        label="Message"
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        required
                                        multiline
                                        rows={3}
                                        sx={{ mb: 2 }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={sendMessage.isPending}
                                    >
                                        {sendMessage.isPending ? 'Sending...' : 'Send for Approval'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">My Messages</Typography>
                                    <Button size="small" startIcon={<Refresh />} onClick={() => refetchMessages()}>
                                        Refresh
                                    </Button>
                                </Box>
                                {!messages?.length ? (
                                    <Typography color="text.secondary" textAlign="center" py={4}>
                                        No messages yet
                                    </Typography>
                                ) : (
                                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                        {messages.map((msg, i) => (
                                            <Box key={msg._id}>
                                                {i > 0 && <Divider />}
                                                <ListItem sx={{ px: 0 }}>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Typography variant="body2">
                                                                    To: <strong>{msg.to.name}</strong>
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={msg.status}
                                                                    color={msg.status === 'approved' ? 'success' : msg.status === 'denied' ? 'error' : 'default'}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2" sx={{ mt: 1 }}>{msg.content}</Typography>
                                                                {msg.rejectionReason && (
                                                                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                                                                        Denied: {msg.rejectionReason}
                                                                    </Alert>
                                                                )}
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {new Date(msg.createdAt).toLocaleString()}
                                                                </Typography>
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            </Box>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Announcements Tab */}
            {tabValue === 2 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                <Campaign sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Announcements
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Committee</InputLabel>
                                    <Select
                                        value={selectedCommittee}
                                        label="Committee"
                                        onChange={(e) => setSelectedCommittee(e.target.value)}
                                        size="small"
                                    >
                                        {committees?.map((c) => (
                                            <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button size="small" startIcon={<Refresh />} onClick={() => refetchAnnouncements()}>
                                    Refresh
                                </Button>
                            </Box>
                        </Box>

                        {!selectedCommittee ? (
                            <Typography color="text.secondary" textAlign="center" py={4}>
                                Select a committee to view announcements
                            </Typography>
                        ) : !announcements?.length ? (
                            <Typography color="text.secondary" textAlign="center" py={4}>
                                No announcements yet
                            </Typography>
                        ) : (
                            <List>
                                {announcements.map((announcement, i) => (
                                    <Box key={announcement._id}>
                                        {i > 0 && <Divider />}
                                        <ListItem sx={{ px: 0 }}>
                                            <Paper
                                                sx={{
                                                    p: 2,
                                                    width: '100%',
                                                    backgroundColor: priorityColors[announcement.priority],
                                                    border: announcement.priority === 'urgent' ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Typography variant="h6">{announcement.title}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Chip
                                                            size="small"
                                                            label={announcement.type.replace('_', ' ')}
                                                            color={announcement.type === 'breaking_news' ? 'error' : 'default'}
                                                        />
                                                        {announcement.priority !== 'normal' && (
                                                            <Chip
                                                                size="small"
                                                                label={announcement.priority}
                                                                color={announcement.priority === 'urgent' ? 'error' : 'warning'}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                    {announcement.body}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                                    Posted by {announcement.postedBy.name} • {new Date(announcement.createdAt).toLocaleString()}
                                                </Typography>
                                            </Paper>
                                        </ListItem>
                                    </Box>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};
