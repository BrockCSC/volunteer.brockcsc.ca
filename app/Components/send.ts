import type { formFields } from './body/types';

const WORKER_URL = import.meta.env.DEV
    ? 'http://127.0.0.1:8787' // Calls local worker if in dev env (use 'npx run dev') to run a local worker
    : 'https://volunteer-worker.brockcsc.workers.dev';

export const sendApplication = async (
    formData: formFields,
    roleTitle: string,
) => {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                formData,
                roleTitle,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || `HTTP error! status: ${response.status}`,
            );
        }

        return data;
    } catch (error) {
        console.error('Send Application Error:', error);
        throw error;
    }
};
