import type { JobListProp } from '../types';

import Job from './job';
import { RoleConfig } from '../config';

export default function JobList({ selectedJob, setSelectedJob }: JobListProp) {
    return (
        <div
            className={`aboslute top-0 flex flex-col items-center justify-between ${selectedJob === -1 ? '-translate-x-0' : '-translate-x-[100vw]'} transition duration-250 ease-in-out px-10`}
        >
            <p className="font-bold text-center text-2xl p-5">
                Volunteer Opportunities
            </p>
            {RoleConfig.map((value, index) => (
                <Job
                    key={value.title}
                    title={value.title}
                    description={value.description}
                    setSelectedJob={setSelectedJob}
                    jobId={index}
                />
            ))}
        </div>
    );
}
