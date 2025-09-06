import { useState } from 'react';

import JobList from './joblist/joblist';
import Form from './form/form';

export default function Body() {
    const [selectedJob, setSelectedJob] = useState(-1);

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
