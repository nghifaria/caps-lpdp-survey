import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import FormField from "../../components/forms/FormField";

import loginImage from "../../assets/login-image.png";

const LoginPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});

    // HANDLE INPUT
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        // hapus error saat user mulai ngetik
        setErrors({
            ...errors,
            [e.target.name]: "",
        });
    };

    // VALIDATION
    const validateForm = () => {
        let newErrors = {};

        // EMAIL
        if (!formData.email) {
            newErrors.email = "Email wajib diisi.";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Format email tidak valid.";
        }

        // PASSWORD
        if (!formData.password) {
            newErrors.password = "Password wajib diisi.";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password minimal 8 karakter.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // SUBMIT
    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            console.log("LOGIN BERHASIL");
            console.log(formData);

            // redirect sementara
            navigate("/admin");
        }
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden">

            {/* LEFT SIDE */}
            <div
                className="
                    relative hidden
                    w-1/2 items-center justify-center
                    bg-[#F5F5F5]
                    lg:flex
                "
            >

                {/* Hero Image */}
                <img
                    src={loginImage}
                    alt="LPDP Awardee"
                    className="
                        h-screen w-full
                        object-cover
                    "
                />

            </div>

            {/* RIGHT SIDE */}
            <div
                className="
                    relative flex w-full items-center justify-center
                    bg-[#D97843]
                    px-8 py-12
                    lg:w-1/2
                "
            >

                {/* Decorative Shape */}
                <div
                    className="
                        absolute right-0 top-0
                        h-full w-full
                        bg-[#E08450]
                        opacity-60
                        [clip-path:polygon(100%_0,100%_100%,40%_100%)]
                    "
                />

                {/* Form Container */}
                <div className="relative z-10 w-full max-w-md">

                    {/* Title */}
                    <h1
                        className="
                            mb-12 text-center
                            text-3xl font-bold
                            text-[#242428]
                        "
                    >
                        Login
                    </h1>

                    {/* FORM */}
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        {/* EMAIL */}
                        <FormField
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                        />

                        {/* PASSWORD */}
                        <FormField
                            label="Password"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                        />

                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="
                                mt-6 w-full rounded-xl
                                bg-[#242428]
                                py-2
                                text-lg font-semibold
                                text-white
                                transition-all duration-300
                                hover:bg-black
                            "
                        >
                            Login
                        </button>

                    </form>

                    {/* FOOTER */}
                    <p
                        className="
                            mt-10 text-center
                            text-white
                        "
                    >
                        Don&apos;t have an account?{" "}

                        <Link
                            to="/signup"
                            className="font-bold underline"
                        >
                            Sign Up
                        </Link>

                    </p>

                </div>

            </div>

        </div>
    );
};

export default LoginPage;