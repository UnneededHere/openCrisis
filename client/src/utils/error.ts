export const extractErrorMessage = (error: any): string => {
    // Check for network errors or no response first
    if (!error.response) {
        return error.message || 'Network error or server unreachable';
    }

    // If it's a structured API error response
    if (error.response?.data?.error) {
        const { message, details } = error.response.data.error;

        // Handle Validation Errors specifically with detailed field info
        if (details && typeof details === 'object' && Object.keys(details).length > 0) {
            const detailStr = Object.entries(details)
                .map(([field, msgs]) => {
                    // msgs is usually string[], but handle string just in case
                    const messages = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                    return `${field}: ${messages}`;
                })
                .join('; ');

            // If the main message is generic "Invalid request data", just use the details
            if (message === 'Invalid request data' || message === 'Validation failed') {
                return `Validation Error: ${detailStr}`;
            }

            return `${message} (${detailStr})`;
        }

        // Return the main error message if validation details fallback failed or it's another error
        if (message) return message;
    }

    // Fallback to standard HTTP status text if available
    if (error.response?.statusText) {
        return `Error: ${error.response.statusText} (${error.response.status})`;
    }

    // Final fallback
    return error.message || 'An unexpected error occurred';
};
