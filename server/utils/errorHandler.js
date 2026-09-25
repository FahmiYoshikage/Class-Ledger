/**
 * Centralized API Error Sanitizer
 * Ensures that sensitive server details (filesystem paths, stack traces,
 * database errors, system permission codes like EACCES) are never leaked to the client.
 */

export const handleApiError = (
    res,
    error,
    userMessage = 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
    statusCode = 500
) => {
    if (error) {
        console.error(`❌ [API Error ${statusCode}] ${userMessage}:`, error?.stack || error?.message || error);
    }

    return res.status(statusCode).json({
        success: false,
        message: userMessage,
        error: userMessage,
    });
};

export default handleApiError;
