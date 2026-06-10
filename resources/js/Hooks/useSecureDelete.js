import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';

export function useSecureDelete() {
    const { lang } = useLang();
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleteRoute, setDeleteRoute] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [deleteData, setDeleteData] = useState({});

    /**
     * Initializes the deletion process and opens the modal.
     * @param {string} routeUrl - The full route URL to send the DELETE/POST request to.
     * @param {any} item - The item or context being deleted (used to show the modal).
     * @param {object} additionalData - Any additional data to send (e.g. { ids: [...] } for bulk).
     */
    const requestDelete = (routeUrl, item = true, additionalData = {}) => {
        setDeleteRoute(routeUrl);
        setItemToDelete(item);
        setDeleteData(additionalData);
        setDeletePassword("");
        setDeleteError("");
    };

    /**
     * Confirms the deletion and sends the request.
     * @param {function} onSuccessCallback - Optional callback after successful deletion.
     * @param {string} method - The HTTP method to use (default: 'DELETE'). For bulk, use 'POST'.
     */
    const confirmDelete = (onSuccessCallback = null, method = 'DELETE') => {
        setDeleteError("");
        setProcessing(true);

        const dataPayload = {
            ...deleteData,
            password: deletePassword,
        };

        if (method === 'DELETE') {
            dataPayload._method = 'DELETE';
            // Use POST because inertia delete doesn't support sending body data easily in some setups
            // but laravel accepts POST with _method = DELETE
            method = 'POST';
        }

        router.post(deleteRoute, dataPayload, {
            onSuccess: () => {
                setItemToDelete(null);
                setDeletePassword("");
                setDeleteRoute(null);
                setDeleteData({});
                setProcessing(false);
                if (onSuccessCallback) onSuccessCallback();
            },
            onError: (errs) => {
                setProcessing(false);
                if (errs.error) setDeleteError(errs.error);
                else if (errs.password) setDeleteError(errs.password);
                else setDeleteError(lang === "ar" ? "حدث خطأ ما." : "An error occurred.");
            },
        });
    };

    const cancelDelete = () => {
        setItemToDelete(null);
        setDeleteRoute(null);
        setDeleteData({});
        setDeleteError("");
        setDeletePassword("");
    };

    return {
        itemToDelete,
        deletePassword,
        setDeletePassword,
        deleteError,
        processing,
        requestDelete,
        confirmDelete,
        cancelDelete
    };
}
