import Logo from './csc-logo.svg';

export default function Topbar() {
    return (
        <div className="w-full bg-[#aa3b3b] min-w-sm">
            <nav className="mx-auto max-w-4xl flex items-center px-10 py-5 justify-between">
                <div className="flex-1">
                    <a
                        href="https://www.brockcsc.ca"
                        className="flex gap-2 hover:opacity-80 return-link transition duration-200"
                    >
                        <div className="arrow-container text-white">
                            <i className="arrow left"></i>
                            <span className="arrow-stem bg-white"></span>
                        </div>
                        <span className="text-white">Return</span>
                    </a>
                </div>

                <div className="flex-1">
                    <div className="flex justify-end">
                        <img
                            src={Logo}
                            alt="BrockCSC Logo"
                            className="h-10 w-auto"
                        />
                    </div>
                </div>
            </nav>
        </div>
    );
}
