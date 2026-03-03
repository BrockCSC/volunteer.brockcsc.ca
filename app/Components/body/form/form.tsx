import type { formFields } from '../types';

import Field from './field';
import { sendApplication } from '~/Components/send';
import { FIELD_LIMITS } from './formConfig';
import { useState, type ChangeEventHandler } from 'react';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function Form() {
    const [formData, setFormData] = useState<formFields>({
        name: '',
        discord: '',
        email: '',
        year: '',
    });
    const [errors, setErrors] = useState({
        name: '',
        discord: '',
        email: '',
        year: '',
    });
    const [invalidSubmission, setInvalidSubmission] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(-1);

    const validationRules = {
        name: {
            required: true,
            message: 'Name is required',
        },
        discord: {
            required: true,
            message: 'Discord username is required',
        },
        email: {
            required: true,
            message: 'Email is required',
            validators: [
                {
                    test: (value: string) =>
                        value.trim().toLowerCase().endsWith('@brocku.ca'),
                    message: 'Must use a Brock University email (@brocku.ca)',
                },
            ],
        },
        year: {
            required: true,
            message: 'Year is required',
            validators: [
                {
                    test: (value: string) => YEAR_OPTIONS.includes(value),
                    message: 'Please select a valid year',
                },
            ],
        },
    };

    const validateField = (name: string, value: string): string => {
        const rules = (validationRules as Record<string, any>)[name];

        if (!rules) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
            return '';
        }

        if (isOverLimit(name, value)) {
            const limit = FIELD_LIMITS[name as keyof typeof FIELD_LIMITS]?.max;
            const message = `Maximum ${limit} characters allowed`;
            setErrors((prev) => ({
                ...prev,
                [name]: message,
            }));
            return message;
        }

        if (rules.required && !value.trim()) {
            setErrors((prev) => ({
                ...prev,
                [name]: rules.message,
            }));
            return rules.message;
        }

        if (rules.validators && value.trim()) {
            for (const validator of rules.validators) {
                if (!validator.test(value)) {
                    setErrors((prev) => ({
                        ...prev,
                        [name]: validator.message,
                    }));
                    return validator.message;
                }
            }
        }

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
        return '';
    };

    const handleChange: ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement
    > = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        validateField(name, value);
    };

    const isOverLimit = (field: string, value: string): boolean => {
        const limit = FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]?.max;
        return limit ? value.length > limit : false;
    };

    async function handleSubmit() {
        if (isSubmitting) return;

        let isValid = true;

        for (const [field, value] of Object.entries(formData)) {
            const error = validateField(field, value);
            if (error) {
                isValid = false;
            }
        }

        if (!isValid) {
            setInvalidSubmission(true);
            return;
        }

        setInvalidSubmission(false);
        setIsSubmitting(true);
        setSubmissionStatus(-1);

        try {
            await sendApplication(formData);
            setSubmissionStatus(1);
        } catch {
            setSubmissionStatus(0);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-10">
            {submissionStatus === -1 ? (
                <div className="flex flex-col justify-center items-center">
                    <div className="flex-1 font-bold text-2xl text-center">
                        BrockCSC Exec Recruitment
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                        Share your details and we will follow up.
                    </p>

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
                        question="Discord Username"
                        id="discord"
                        error={errors.discord}
                        value={formData.discord}
                        placeholder="username"
                        handleChange={handleChange}
                    />
                    <Field
                        isRequired={true}
                        question="Email Address"
                        id="email"
                        error={errors.email}
                        value={formData.email}
                        placeholder="Enter your email address"
                        handleChange={handleChange}
                    />

                    <div className="flex flex-col items-left w-full mt-5 max-w-xl">
                        <label htmlFor="year" className="font-bold">
                            Year*
                        </label>
                        <select
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className={`border rounded-md p-2 mt-2 bg-white ${errors.year ? 'outline-red-600 border-red-600' : ''}`}
                        >
                            <option value="">Select your year</option>
                            {YEAR_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        {errors.year && (
                            <p className="text-[#e32222] text-xs">
                                {errors.year}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={`mt-5 hover:bg-[#8B0000] bg-[#aa3b3b] rounded-md text-white py-2 px-10 ${isSubmitting ? 'cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#aa3b3b] cursor-pointer'}`}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                    {invalidSubmission && (
                        <p className="text-[#e32222] text-xs mt-2">
                            One or more fields contain invalid entries
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    {submissionStatus === 1 ? (
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
                                Failed to Submit
                            </div>
                            <p className="text-xs text-gray-900 text-center">
                                Please try again later or contact{' '}
                                <a
                                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                                    href="mailto:admin@brockcsc.ca"
                                >
                                    admin@brockcsc.ca
                                </a>
                                .
                            </p>
                        </div>
                    )}

                    <div className="w-full border-t-2 border-dashed border-gray-300 mt-10"></div>
                    <div className="text-xl text-center font-bold text-gray-900 mt-5">
                        Your Responses
                    </div>
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">Full Name</p>
                        <p>{formData.name}</p>
                    </div>
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">
                            Discord Username
                        </p>
                        <p>{formData.discord}</p>
                    </div>
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">
                            Email Address
                        </p>
                        <p>{formData.email}</p>
                    </div>
                    <div className="mt-2">
                        <p className="text-lg mt-2 font-semibold">Year</p>
                        <p>{formData.year}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
