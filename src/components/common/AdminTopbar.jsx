import logo from "../../assets/logo_lpdp.png";

const AdminTopbar = () => {
    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <header className="sticky top-0 z-50 bg-light-grey shadow-sm">
            <div className="flex h-24 items-center justify-between px-6 md:px-10">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="LPDP Logo"
                        className="h-12 w-auto object-contain"/>

                    <div className="leading-tight">
                        <h1 className="text-md font-semibold text-[#DE7A49]">
                            Survey
                        </h1>

                        <h1 className="text-md font-semibold text-[#DE7A49]">
                            Awardee LPDP
                        </h1>

                    </div>
                </div>

                <div>
                    <h1 className="text-md font-medium text-ash md:text-lg">
                        {formattedDate}
                    </h1>
                </div>
            </div>
        </header>
    );
};

export default AdminTopbar;