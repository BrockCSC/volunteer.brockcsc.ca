import Topbar from '../Components/topbar/topbar';
import Roles from '../Components/body/body';

export function meta() {
    return [
        { title: 'Volunteer at BrockCSC' },
        {
            name: 'description',
            content: 'We are excited to have you join the BrockCSC staff team!',
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
