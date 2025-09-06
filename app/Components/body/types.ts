import type { ChangeEventHandler } from 'react';

type selectedJob = number; // A id for the job currently selected

export type JobProp = {
    title: string;
    description: string;
    setSelectedJob: (jobId: number) => void;
    jobId: number;
};

export type JobListProp = {
    selectedJob: selectedJob;
    setSelectedJob: (jobId: number) => void;
};

export type formFields = {
    name: string;
    email: string;
    year: string;
    portfolio: string;
    skills: string;
};

export type formValidation = {
    required: boolean;
    validators?: any;
};

export type FieldProp = {
    isRequired?: boolean;
    question: string;
    placeholder: string;
    id: string;
    isLong?: boolean;
    error?: string;
    hint?: string;
    value?: string;
    handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};
