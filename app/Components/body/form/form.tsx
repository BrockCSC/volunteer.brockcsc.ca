import type { formFields, JobListProp } from '../types';

import { RoleConfig } from '../config';
import Field from './field';
import { sendApplication } from '~/Components/send';
import { FIELD_LIMITS } from './formConfig';
import {
    useState,
    type ChangeEventHandler,
    type Dispatch,
    type SetStateAction,
} from 'react';

export default function Form({ selectedJob, setSelectedJob }: JobListProp) {
    const [formData, setFormData]: [
        formFields,
        Dispatch<SetStateAction<formFields>>,
    ] = useState({
        name: '',
        email: '',
        year: '',
        portfolio: '',
        skills: '',
    });
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        year: '',
        portfolio: '',
        skills: '',
    });
    const [invalidSubmission, setInvalidSubmission] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(-1);

    const validationRules = {
        name: {
            required: true,
            message: 'Name is required',
        },
        email: {
            required: true,
            message: 'Email is required',
            validators: [
                {
                    test: (value: string) =>
                        value.toLowerCase().endsWith('@brocku.ca'),
                    message:
                        'Must use a Brock University email (******@brocku.ca)',
                },
            ],
        },
        year: {
            required: true,
            message: 'This field is required',
        },
        portfolio: {
            required: true,
            message: 'This field is required',
            selector: [0, 2],
        },
        skills: {
            required: true,
            message: 'This field is required',
        },
    };

    const validateField = (name: string, value: string) => {
        const rules = (validationRules as any)[name];

        if (
            !rules ||
            (rules.selector && !rules.selector.includes(selectedJob))
        ) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
            return;
        }

        // Check character limits first
        if (isOverLimit(name, value)) {
            const limit = FIELD_LIMITS[name as keyof typeof FIELD_LIMITS]?.max;
            setErrors((prev) => ({
                ...prev,
                [name]: `Maximum ${limit} characters allowed`,
            }));
            return;
        }

        if (rules.required && !value.trim()) {
            setErrors((prev) => ({
                ...prev,
                [name]: rules.message,
            }));
            return;
        }

        if (rules.validators && value.trim()) {
            for (const validator of rules.validators) {
                if (!validator.test(value)) {
                    setErrors((prev) => ({
                        ...prev,
                        [name]: validator.message,
                    }));
                    return;
                }
            }
        }

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const { name, value } = event.target;
        validateField(name, value);

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Check if any field exceeds its character limit
    const isOverLimit = (field: string, value: string): boolean => {
        const limit = FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]?.max;
        return limit ? value.length > limit : false;
    };

    async function handleSubmit() {
        if (isSubmitting) return;
        var isValid: boolean = true;

        // Check character limits first
        for (const [field, value] of Object.entries(formData)) {
            if (isOverLimit(field, value)) {
                const limit =
                    FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]?.max;
                setErrors((prev) => ({
                    ...prev,
                    [field]: `Maximum ${limit} characters allowed`,
                }));
                isValid = false;
            }
        }

        // Only proceed with other validations if character limits are okay
        if (isValid) {
            for (const [key, value] of Object.entries(formData)) {
                validateField(key, value);
            }

            for (const value of Object.values(errors)) {
                if (value) {
                    isValid = false;
                    break;
                }
            }
        }

        if (!isValid) {
            setInvalidSubmission(true);
            return;
        }

        // Batch state updates before submission
        setInvalidSubmission(false);
        setIsSubmitting(true);
        setSubmissionStatus(-1);

        try {
            await sendApplication(formData, RoleConfig[selectedJob].title);
            // Batch state updates after success
            Promise.resolve().then(() => {
                setIsSubmitting(false);
                setSubmissionStatus(1);
            });
        } catch (err) {
            // Batch state updates after failure
            Promise.resolve().then(() => {
                setIsSubmitting(false);
                setSubmissionStatus(0);
            });
        }
    }

    return (
        <div className="p-10">
            <button
                className="flex flex-1 gap-2 transition duration-200 hover:opacity-80 back-link cursor-pointer mb-10"
                onClick={() => {
                    setSelectedJob(-1);
                    setSubmissionStatus(-1);
                    setIsSubmitting(false);
                }}
            >
                <div className="arrow-container">
                    <i className="arrow left"></i>
                    <span className="arrow-stem bg-black"></span>
                </div>
                <span>Back</span>
            </button>

            {submissionStatus == -1 ? (
                <div className="flex flex-col justify-center items-center">
                    <div className="flex-1 font-bold text-2xl">
                        {RoleConfig[selectedJob].title}
                    </div>
                    <Field
                        isRequired={true}
                        question="Full Name"
                        id="name"
                        error={errors.name}
                        value={formData.name}
                        placeholder="Enter your full name"
                        handleChange={handleChange}
                    />
                    <Field
                        isRequired={true}
                        question="Email Address"
                        id="email"
                        error={errors.email}
                        value={formData.email}
                        placeholder="Enter your Brock Email Address (******@brocku.ca)"
                        handleChange={handleChange}
                    />
                    <Field
                        isRequired={true}
                        question="Anticipated Graduation Date"
                        id="year"
                        error={errors.year}
                        value={formData.year}
                        placeholder="Term and year (Fall 2027)"
                        handleChange={handleChange}
                    />
                    {(selectedJob == 0 || selectedJob == 2) && (
                        <Field
                            isRequired={true}
                            question="Portfolio/Resume"
                            id="portfolio"
                            error={errors.portfolio}
                            value={formData.portfolio}
                            hint="Upload documents to Google Drive and share a link here (Ensure everyone with link can view)"
                            placeholder="Enter your response here"
                            handleChange={handleChange}
                        />
                    )}
                    <Field
                        isRequired={true}
                        isLong={true}
                        question="Why do you want to join the staff team?"
                        id="skills"
                        error={errors.skills}
                        value={formData.skills}
                        placeholder="Enter your response here"
                        handleChange={handleChange}
                    />
                    <button
                        type="submit"
                        className={`mt-5 hover:bg-[#8B0000] bg-[#aa3b3b] rounded-md text-white py-2 px-10 ${isSubmitting ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#aa3b3b] cursor-pointer'}`}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center">
                                <svg
                                    className="animate-spin ml-3 mr-3 h-6 w-6 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            </div>
                        ) : (
                            'Apply'
                        )}
                    </button>
                    {invalidSubmission && (
                        <p className="text-[#e32222] text-xs mt-2">
                            One or more fields contain invalid entries
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    {submissionStatus == 1 ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg
                                    className="w-12 h-12 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                    ></path>
                                </svg>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Successfully Submitted
                            </div>
                            <p className="text-xs text-gray-500">
                                Hint: We recommend printing this page to retain
                                a copy of your responses.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg
                                    className="w-12 h-12 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                </svg>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                Failed to Submit!
                            </div>
                            <p className="text-xs text-gray-900">
                                Hint: Print this page to retain your responses
                                AND try resubmitting this application later, or
                                contact{' '}
                                <a
                                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                                    href="mailto:admin@brockcsc.ca"
                                >
                                    admin@brockcsc.ca
                                </a>
                            </p>
                        </div>
                    )}

                    <div className="w-full border-t-2 border-dashed border-gray-300 mt-10"></div>
                    <div className="text-xl text-center font-bold text-gray-900 mt-5">
                        Your Responses
                    </div>

                    <p className="text-lg text-center mt-2 font-semibold">
                        {RoleConfig[selectedJob].title}
                    </p>
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">Full Name</p>
                        <p>{formData.name}</p>
                    </div>
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">
                            Email Address
                        </p>
                        <p>{formData.email}</p>
                    </div>
                    {formData.portfolio && (
                        <div className="mt-2">
                            <p className="text-lg font-semibold">
                                Anticipated Graduation Date
                            </p>
                            <p>{formData.portfolio}</p>
                        </div>
                    )}
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">
                            Anticipated Graduation Date
                        </p>
                        <p>{formData.year}</p>
                    </div>
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">
                            Why do you want to join the staff team?
                        </p>
                        <p>{formData.skills}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
