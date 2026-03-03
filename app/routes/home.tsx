import Topbar from '../Components/topbar/topbar';
import Roles from '../Components/body/body';

export function meta() {
    return [
        { title: 'BrockCSC Exec Recruitment' },
        {
            name: 'description',
            content:
                'Recruitment outreach form for prospective BrockCSC executive members.',
        },
    ];
}

export default function Home() {
    return (
        <div className="min-w-sm">
            <Topbar />
            <Roles />
        </div>
    );
}
