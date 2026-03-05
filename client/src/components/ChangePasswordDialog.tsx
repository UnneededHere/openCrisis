import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';

interface ChangePasswordDialogProps {
    open: boolean;
    onClose: () => void;
}

export const ChangePasswordDialog = ({ open, onClose }: ChangePasswordDialogProps) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const changePassword = useMutation({
        mutationFn: async () => {
            const response = await api.put('/users/me/password', {
                currentPassword,
                newPassword,
            });
            return response.data;
        },
        onSuccess: () => {
            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        },
        onError: (err: any) => {
            const message = err?.response?.data?.error?.message || 'Failed to change password';
            setError(message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }

        changePassword.mutate();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    {success ? (
                        <Alert severity="success" sx={{ mt: 1 }}>
                            Password changed successfully!
                        </Alert>
                    ) : (
                        <>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                                    {error}
                                </Alert>
                            )}
                            <TextField
                                fullWidth
                                label="Current Password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                sx={{ mt: 1, mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                helperText="Must be at least 8 characters"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                sx={{ mb: 1 }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={changePassword.isPending}>
                        {success ? 'Close' : 'Cancel'}
                    </Button>
                    {!success && (
                        <Button type="submit" variant="contained" disabled={changePassword.isPending}>
                            {changePassword.isPending ? 'Updating...' : 'Change Password'}
                        </Button>
                    )}
                </DialogActions>
            </form>
        </Dialog>
    );
};
