const guidelineSteps = [
    {
        id: "step1",
        number: "[01]",
        title: "Langkah 1: Isi Data Diri",
    },
    {
        id: "step2",
        number: "[02]",
        title: "Langkah 2: Evaluasi Tahap Pendaftaran",
    },
    {
        id: "step3",
        number: "[03]",
        title: "Langkah 3: Evaluasi Tahap Seleksi",
    },
    {
        id: "step4",
        number: "[04]",
        title: "Langkah 4: Evaluasi Penerimaan Manfaat Beasiswa",
    },
    {
        id: "step5",
        number: "[05]",
        title: "Langkah 5: Penanganan Keluhan",
    },
    {
        id: "step6",
        number: "[06]",
        title: "Langkah 6: Penilaian Petugas Layanan (CSO)",
    },
    {
        id: "step7",
        number: "[07]",
        title: "Langkah 7: Penilaian Umum",
    },
    {
        id: "step8",
        number: "[08]",
        title: "Langkah 8: Selesai & Kirim",
    },
];

const GuidelinePage = () => {
    return (
        <section className="min-h-screen bg-[#FFFCF4] px-5 py-16">

            <div className="mx-auto max-w-6xl text-center">

                {/* Title */}
                <h1 className="mb-5 text-4xl font-bold uppercase text-black md:text-6xl">
                    GUIDELINE
                </h1>

                {/* Description */}
                <p className="mx-auto mb-16 max-w-4xl text-base leading-7 text-black md:text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse vestibulum sem vitae laoreet suscipit.
                    Pellentesque velit magna, faucibus in justo sit amet,
                    congue ornare lorem.
                </p>

                {/* Guideline Steps */}
                <div className="mt-10 flex flex-col gap-6 text-left">
                    {guidelineSteps.map((step) => (
                        <div
                            key={step.id}
                            className="
                                cursor-pointer border-b border-gray-300
                                pb-6
                                transition-all duration-300
                                hover:translate-x-2">
                            <span
                                className=" mr-3 text-sm text-oren-muda md:text-base">
                                {step.number}
                            </span>

                            <span
                                className="text-lg font-semibold text-black md:text-3xl">
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GuidelinePage;