import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Avatar,
    AvatarGroup,
} from '@mui/material';
import { Groups, Person, SupervisorAccount } from '@mui/icons-material';
import { api } from '../api/client';
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface Committee {
    _id: string;
    name: string;
    type: string;
    description?: string;
    conference: { _id: string; name: string };
    members: User[];
    staff: User[];
}

export const CommitteePage = () => {
    const { id } = useParams<{ id: string }>();
    const { setCurrentCommittee } = useAppStore();

    const { data: committee, isLoading, error } = useQuery({
        queryKey: ['committee', id],
        queryFn: async () => {
            const response = await api.get(`/committees/${id}`);
            return response.data.data as Committee;
        },
        enabled: !!id,
    });

    // Join committee room for real-time updates
    useEffect(() => {
        if (id) {
            setCurrentCommittee(id);
        }
        return () => {
            setCurrentCommittee(null);
        };
    }, [id, setCurrentCommittee]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !committee) {
        return (
            <Alert severity="error">
                Failed to load committee details
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Groups sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        {committee.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip size="small" label={committee.type} variant="outlined" />
                        <Chip size="small" label={committee.conference?.name} color="primary" variant="outlined" />
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                About
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {committee.description || 'No description provided'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person /> Delegates ({committee.members?.length || 0})
                            </Typography>

                            {committee.members?.length > 0 && (
                                <AvatarGroup max={8} sx={{ mb: 2, justifyContent: 'flex-start' }}>
                                    {committee.members.map((member) => (
                                        <Avatar key={member._id} sx={{ bgcolor: 'primary.main' }}>
                                            {member.name.charAt(0)}
                                        </Avatar>
                                    ))}
                                </AvatarGroup>
                            )}

                            {!committee.members?.length ? (
                                <Typography color="text.secondary">
                                    No delegates assigned yet
                                </Typography>
                            ) : (
                                <List dense>
                                    {committee.members.map((member) => (
                                        <ListItem key={member._id}>
                                            <ListItemText
                                                primary={member.name}
                                                secondary={member.email}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SupervisorAccount /> Staff ({committee.staff?.length || 0})
                            </Typography>

                            {committee.staff?.length > 0 && (
                                <AvatarGroup max={8} sx={{ mb: 2, justifyContent: 'flex-start' }}>
                                    {committee.staff.map((staff) => (
                                        <Avatar key={staff._id} sx={{ bgcolor: 'secondary.main' }}>
                                            {staff.name.charAt(0)}
                                        </Avatar>
                                    ))}
                                </AvatarGroup>
                            )}

                            {!committee.staff?.length ? (
                                <Typography color="text.secondary">
                                    No staff assigned yet
                                </Typography>
                            ) : (
                                <List dense>
                                    {committee.staff.map((staff) => (
                                        <ListItem key={staff._id}>
                                            <ListItemText
                                                primary={staff.name}
                                                secondary={staff.email}
                                            />
                                        </ListItem>
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
