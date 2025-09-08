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
    designtool: {
        max: 1000,
        label: 'What design tools are you most comfortable using?',
    },
    designproject: {
        max: 1000,
        label: "Tell us about a design project you've worked on.",
    },
    wcssupport: {
        max: 1000,
        label: 'What initiatives would you start (or continue) to support underrepresented groups in Computer Science?',
    },
    wdexperience: {
        max: 1000,
        label: 'Describe any past software development experience, that equip you for this position.',
    },
    ecorganize: {
        max: 1000,
        label: 'How would you stay organized when planning an event with many components?',
    },
    skills: {
        max: 1000,
        label: 'Why do you want to join the staff team?',
    },
} as const;
