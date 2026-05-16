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
            <div className="flex h-24 items-center justify-end px-6 md:px-10">


                <div>
                    <h1 className="text-md font-medium text-ash md:text-md">
                        {formattedDate}
                    </h1>
                </div>
            </div>
        </header>
    );
};

export default AdminTopbar;