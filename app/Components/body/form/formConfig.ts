export const FIELD_LIMITS = {
    name: {
        max: 100,
        label: 'Name',
    },
    email: {
        max: 100,
        label: 'Email',
    },
    year: {
        max: 100,
        label: 'Anticipated Graduation Date',
    },
    portfolio: {
        max: 500,
        label: 'Portfolio/Resume Link',
    },
    skills: {
        max: 5000,
        label: 'Why do you want to join the staff team?',
    },
} as const;
