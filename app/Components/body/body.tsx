import { useState, useEffect } from 'react';

import Form from './form/form';
import { checkApplicationStatus } from '../send';

export default function Body() {
    const [applicationsClosed, setApplicationsClosed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = () => {
            try {
                const isClosed = checkApplicationStatus();
                setApplicationsClosed(isClosed);
            } catch (error) {
                console.error('Failed to check application status:', error);
                setApplicationsClosed(false); // Default to allowing applications
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
    }, []);

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="relative mx-auto min-w-sm max-w-4xl mt-5">
                    <div className="flex flex-col items-center justify-center p-10">
                        <p className="text-lg">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (applicationsClosed) {
        return (
            <div className="w-full">
                <div className="relative mx-auto min-w-sm max-w-4xl mt-5">
                    <div className="flex flex-col items-center justify-center p-10">
                        <h2 className="font-bold text-center text-2xl p-5">
                            Exec Recruitment
                        </h2>
                        <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 text-center max-w-md">
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Recruitment Closed
                            </h3>
                            <p className="text-gray-600">
                                We are not collecting recruitment responses at
                                this time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="relative mx-auto min-w-sm max-w-4xl mt-5">
                <Form />
            </div>
        </div>
    );
}
