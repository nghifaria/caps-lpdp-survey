const socialLinks = [
    {
        name: "Facebook",
        url: "https://www.facebook.com/LPDPKemenkeu/",
        icon: "F",
    },
    {
        name: "Twitter",
        url: "https://x.com/LPDP_RI",
        icon: "X",
    },
    {
        name: "TikTok",
        url: "https://www.tiktok.com/@lpdp_ri",
        icon: "T",
    },
    {
        name: "YouTube",
        url: "https://www.youtube.com/channel/UCLWpsuqDrJ19mTZVLA_ot0w",
        icon: "Y",
    },
    {
        name: "Instagram",
        url: "https://www.instagram.com/LPDP_RI",
        icon: "I",
    },
    {
        name: "LinkedIn",
        url: "https://www.linkedin.com/company/lembaga-pengelola-dana-pendidikan/",
        icon: "L",
    },
];

const RespFooter = () => {
    return (
        <footer className="mt-20">

            {/* Top Footer */}
            <div className="bg-oren px-5 py-10 text-center text-white">
                <div className="mx-auto max-w-5xl">
                    <h3 className="mb-6 text-2xl font-semibold">
                        Follow us
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-5">
                        {socialLinks.map((social) => (
                            <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={social.name}
                                className="
                                    flex h-12 w-12 items-center justify-center
                                    rounded-full bg-ash
                                    text-lg font-semibold text-white
                                    transition-all duration-300
                                    hover:bg-black
                                "
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="bg-ash px-5 py-5 text-center text-white">
                <p className="text-sm md:text-base">
                    Copyright © 2024 LPDP Kemenkeu RI & IPB University
                </p>
            </div>
        </footer>
    );
};

export default RespFooter;