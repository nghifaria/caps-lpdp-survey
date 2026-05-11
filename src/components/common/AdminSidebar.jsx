import { NavLink } from "react-router-dom";

const AdminSidebar = () => {
    const menuItems = [
        {
            name: "Dashboard",
            path: "/admin",
        },
        {
            name: "Respondents",
            path: "/admin/respondents",
        },
        {
            name: "Surveys",
            path: "/admin/surveys",
        },
        {
            name: "Reports",
            path: "/admin/reports",
        },
    ];

    return (
        <aside
            className="
                flex h-screen w-[270px] flex-col
                justify-between
                bg-[#242428]
                px-5 py-6
                text-white">

            {/* Top Section */}
            <div>
                {/* Navigation */}
                <nav className="flex flex-col gap-3">

                    {menuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `
                                rounded-xl px-5 py-2
                                text-md font-medium
                                transition-all duration-300
                                
                                ${
                                    isActive
                                        ? "bg-[#DE7A49] text-white"
                                        : "text-white hover:bg-[#DE7A49]/20"
                                }
                                `
                            }
                        >
                            {item.name}
                        </NavLink>
                    ))}

                </nav>

            </div>

            {/* Bottom Section */}
            <div>

                {/* User Info */}
                <div className="mb-5 flex items-center gap-4">

                    {/* Avatar */}
                    <div className="
                            flex h-14 w-14 items-center justify-center
                            rounded-full border-2 border-white
                            text-2xl">
                        👤
                    </div>

                    {/* User Detail */}
                    <div>
                        <h2 className="text-lg font-semibold">
                            Admin LPDP
                        </h2>
                        <p className="text-sm text-gray-300">
                            adminlpdp@gmail.com
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    className="
                        flex w-full items-center justify-center gap-2
                        rounded-xl bg-[#DE7A49]
                        px-5 py-4
                        text-lg font-semibold text-white
                        transition-all duration-300
                        hover:bg-[#C9683B]
                    "
                >
                    ⎋ Logout
                </button>

            </div>

        </aside>
    );
};

export default AdminSidebar;