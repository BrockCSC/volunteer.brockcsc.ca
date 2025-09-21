import { useState, useEffect } from 'react';

import JobList from './joblist/joblist';
import Form from './form/form';
import { checkApplicationStatus } from '../send';

export default function Body() {
    const [selectedJob, setSelectedJob] = useState(-1);
    const [applicationsClosed, setApplicationsClosed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const isClosed = await checkApplicationStatus();
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
                            Volunteer Opportunities
                        </h2>
                        <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 text-center max-w-md">
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Applications Closed
                            </h3>
                            <p className="text-gray-600">
                                No available volunteer roles at this time. The
                                application period has ended.
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
                {selectedJob === -1 ? (
                    <JobList
                        selectedJob={selectedJob}
                        setSelectedJob={setSelectedJob}
                    />
                ) : (
                    <Form
                        selectedJob={selectedJob}
                        setSelectedJob={setSelectedJob}
                    />
                )}
            </div>
        </div>
    );
}
