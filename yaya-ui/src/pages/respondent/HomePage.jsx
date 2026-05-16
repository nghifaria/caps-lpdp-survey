import { useNavigate } from "react-router-dom";
import heroImage from "../../assets/hero_bg.png";

const HomePage = () => {
    const navigate = useNavigate();

    const handleSurveyClick = () => {
        navigate("/survey/1");
    };

    return (
        <div className="flex min-h-screen flex-col">

            {/* Hero Section */}
            <section
                className="relative flex min-h-screen items-end justify-center bg-cover bg-center bg-no-repeat px-5 pb-20"
                style={{backgroundImage: `url(${heroImage})`, }}
            >

                {/* Content */}
                <div className="relative z-10 text-center">

                    <h1 className="mb-8 text-4xl font-bold tracking-wide text-white drop-shadow-lg md:text-6xl">
                        SURVEI BEASISWA LPDP
                    </h1>

                    <button
                        onClick={handleSurveyClick}
                        className="rounded-full border-2 border-white bg-oren px-8 py-3
                            text-lg font-semibold uppercase tracking-wide text-white
                            transition-all duration-300
                            hover:-translate-y-1 hover:bg-oren-muda hover:shadow-lg"
                    >
                        Isi Sekarang
                    </button>

                </div>
            </section>

            {/* Stats Section */}
            <section className="flex min-h-[600px] flex-col md:flex-row">

                {/* Left Section */}
                <div className="
                        flex flex-1 flex-col justify-center
                        bg-[linear-gradient(144deg,#2050A5_50%,#1C4999_50%)]
                        px-8 py-14 text-white md:px-16">

                    <h2 className="mb-2 text-3xl font-bold tracking-wide">
                        TINGKAT PARTISIPASI
                    </h2>

                    <p className="mb-10 text-base opacity-90">
                        per 31 December 2024
                    </p>

                    <div className="mb-10">
                        <h3 className="-mb-1 text-6xl font-bold transition-all duration-500 md:text-8xl">
                            14.065
                        </h3>

                        <p className="text-xl font-medium">
                            Total Responden
                        </p>
                    </div>

                    <div>
                        <h3 className="-mb-1 text-6xl font-bold transition-all duration-500 md:text-8xl">
                            2.789
                        </h3>

                        <p className="text-xl font-medium">
                            Penerima Beasiswa
                        </p>
                    </div>

                </div>

                {/* Right Section */}
                <div className="flex flex-1 flex-col justify-center bg-ash px-8 py-14 text-white md:px-16">

                    <h2 className="mb-8 text-2xl font-bold leading-snug md:text-4xl">
                        SURVEI KEPUASAN PUBLIK ATAS LAYANAN
                        BEASISWA LPDP TAHUN 2024
                    </h2>

                    <p className="mb-5 text-justify leading-7">
                        Selamat bergabung dalam Survei Kepuasan Publik
                        terhadap Layanan LPDP Tahun 2024.
                    </p>

                    <p className="mb-5 text-justify leading-7">
                        LPDP bekerja sama dengan Institut Pertanian Bogor
                        (IPB) menyelenggarakan survei ini guna mengevaluasi
                        kualitas layanan beasiswa yang Saudara terima pada
                        tahun 2024. Partisipasi dan masukan dari Saudara
                        sangat kami harapai sebagai bahan perbaikan dan
                        pengembangan layanan LPDP ke depan.
                    </p>

                    <p className="mb-5 text-justify leading-7">
                        Kami mohon Saudara mengisi survei ini secara objektif
                        berdasarkan pengalaman pribadi dalam berinteraksi
                        dengan unit layanan beasiswa LPDP.
                    </p>

                    <p className="text-justify leading-7">
                        Kami menjamin kerahasiaan identitas dan data yang
                        Saudara berikan. Seluruh data akan dianalisis secara
                        agregat semata-mata untuk keperluan evaluasi. Atas
                        perhatian dan partisipasi Saudara, kami ucapkan
                        terima kasih.
                    </p>

                </div>
            </section>
        </div>
    );
};

export default HomePage;