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
} from '@mui/material';
import { Send, Description, Refresh } from '@mui/icons-material';
import { api } from '../api/client';
import { useAppStore } from '../stores/appStore';
import type { DirectiveType } from '@opencrisis/shared';

interface Committee {
    _id: string;
    name: string;
    type: string;
    conference: { _id: string; name: string };
}

interface Directive {
    _id: string;
    title: string;
    body: string;
    type: DirectiveType;
    status: string;
    feedback?: string;
    outcome?: string;
    createdAt: string;
    committee: { _id: string; name: string };
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    submitted: 'default',
    in_review: 'info',
    needs_revision: 'warning',
    approved: 'success',
    denied: 'error',
    executed: 'secondary',
};

export const DelegateDashboard = () => {
    const queryClient = useQueryClient();
    const { realtimeDirectives, realtimeUpdates } = useAppStore();

    const [selectedCommittee, setSelectedCommittee] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState<DirectiveType>('public');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch committees
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

    // Create directive mutation
    const createDirective = useMutation({
        mutationFn: async (data: { title: string; body: string; type: DirectiveType; committee: string }) => {
            const response = await api.post('/directives', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['directives'] });
            setTitle('');
            setBody('');
            setType('public');
            setSuccessMessage('Directive submitted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCommittee || !title.trim() || !body.trim()) return;

        createDirective.mutate({
            title: title.trim(),
            body: body.trim(),
            type,
            committee: selectedCommittee,
        });
    };

    // Combine fetched directives with real-time ones
    const allDirectives = [...realtimeDirectives, ...(directives || [])].filter(
        (d, i, arr) => arr.findIndex((x) => x._id === d._id) === i
    );

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Delegate Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Submit directives and track their status
            </Typography>

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

                            <form onSubmit={handleSubmit}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="committee-label">Committee</InputLabel>
                                    <Select
                                        labelId="committee-label"
                                        value={selectedCommittee}
                                        label="Committee"
                                        onChange={(e) => setSelectedCommittee(e.target.value)}
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
                                    inputProps={{ 'aria-label': 'Directive title' }}
                                />

                                <TextField
                                    fullWidth
                                    label="Directive Body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    required
                                    multiline
                                    rows={6}
                                    sx={{ mb: 2 }}
                                    helperText="Describe your directive action in detail"
                                    inputProps={{ 'aria-label': 'Directive body' }}
                                />

                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel id="type-label">Type</InputLabel>
                                    <Select
                                        labelId="type-label"
                                        value={type}
                                        label="Type"
                                        onChange={(e) => setType(e.target.value as DirectiveType)}
                                    >
                                        <MenuItem value="public">Public</MenuItem>
                                        <MenuItem value="private">Private</MenuItem>
                                        <MenuItem value="covert">Covert</MenuItem>
                                    </Select>
                                </FormControl>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={createDirective.isPending}
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
                                <Button
                                    size="small"
                                    startIcon={<Refresh />}
                                    onClick={() => refetch()}
                                >
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
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Typography fontWeight={600}>{directive.title}</Typography>
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
                                                                {directive.body.length > 150 ? directive.body.slice(0, 150) + '...' : directive.body}
                                                            </Typography>
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

                {/* Updates Feed */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Crisis Updates
                            </Typography>
                            {realtimeUpdates.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={4}>
                                    No updates yet. Updates will appear here in real-time.
                                </Typography>
                            ) : (
                                <List>
                                    {realtimeUpdates.map((update, index) => (
                                        <Box key={update._id}>
                                            {index > 0 && <Divider />}
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemText
                                                    primary={update.title}
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                                {update.body}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Posted by {update.postedBy.name} • {new Date(update.createdAt).toLocaleString()}
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
        </Box>
    );
};
