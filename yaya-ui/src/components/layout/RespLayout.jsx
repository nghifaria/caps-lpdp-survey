import { Outlet } from "react-router-dom";

import RespNavbar from "../common/RespNavbar";
import RespFooter from "../common/RespFooter";

const RespLayout = () => {
    return (
        <div className="flex min-h-screen flex-col">

            {/* Navbar */}
            <RespNavbar />

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <RespFooter />

        </div>
    );
};

export default RespLayout;