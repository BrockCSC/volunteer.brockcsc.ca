import type { JobProp } from '../types';

export default function Job({
    title,
    description,
    setSelectedJob,
    jobId,
}: JobProp) {
    return (
        <div className="flex border-2 border-gray-500 hover:border-[#aa3b3b] rounded-md w-full my-5 p-5 bg-gray-100 hover:bg-gray-200 transition duration-200">
            <div className="flex-4">
                <p className="font-bold text-xl">{title}</p>
                <p>{description}</p>
            </div>
            <div className="flex flex-1 pl-5 items-center justify-center">
                <button
                    className="bg-[#aa3b3b] text-white px-4 py-3 rounded-md hover:bg-[#8B0000] transition cursor-pointer duration-200 whitespace-nowrap"
                    onClick={() => {
                        setSelectedJob(jobId);
                    }}
                >
                    Apply!
                </button>
            </div>
        </div>
    );
}
