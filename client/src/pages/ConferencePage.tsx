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
} from '@mui/material';
import { Event, Groups } from '@mui/icons-material';
import { api } from '../api/client';

interface Committee {
    _id: string;
    name: string;
    type: string;
}

interface Conference {
    _id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    createdBy: { name: string };
    committees: Committee[];
}

export const ConferencePage = () => {
    const { id } = useParams<{ id: string }>();

    const { data: conference, isLoading, error } = useQuery({
        queryKey: ['conference', id],
        queryFn: async () => {
            const response = await api.get(`/conferences/${id}`);
            return response.data.data as Conference;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !conference) {
        return (
            <Alert severity="error">
                Failed to load conference details
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Event sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        {conference.name}
                    </Typography>
                    <Chip
                        size="small"
                        label={conference.isActive ? 'Active' : 'Inactive'}
                        color={conference.isActive ? 'success' : 'default'}
                    />
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Conference Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {conference.description || 'No description provided'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                                Created by {conference.createdBy?.name} on {new Date(conference.createdAt).toLocaleDateString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Groups /> Committees ({conference.committees?.length || 0})
                            </Typography>
                            {!conference.committees?.length ? (
                                <Typography color="text.secondary">
                                    No committees created yet
                                </Typography>
                            ) : (
                                <List>
                                    {conference.committees.map((committee) => (
                                        <ListItem key={committee._id}>
                                            <ListItemText
                                                primary={committee.name}
                                                secondary={committee.type}
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
