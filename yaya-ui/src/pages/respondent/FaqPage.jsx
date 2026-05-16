import { useState } from "react";

const faqData = [
    {
        id: "faq1",
        question: "Lorem ipsum dolor sit amet",
        answer:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vestibulum sem vitae laoreet suscipit. Pellentesque velit magna, faucibus in justo sit amet.",
    },
    {
        id: "faq2",
        question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        answer:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vestibulum sem vitae laoreet suscipit. Pellentesque velit magna, faucibus in justo sit amet, congue ornare lorem.",
    },
    {
        id: "faq3",
        question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        answer:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vestibulum sem vitae laoreet suscipit. Pellentesque velit magna, faucibus in justo sit amet, congue ornare lorem.",
    },
    {
        id: "faq4",
        question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        answer:
            "Kami sangat menghargai masukan dan saran dari para awardee untuk pengembangan program LPDP yang lebih baik di masa depan.",
    },
    {
        id: "faq5",
        question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        answer:
            "Tim kami siap membantu Anda dengan pertanyaan atau masalah yang Anda hadapi. Jangan ragu untuk menghubungi kami kapan saja.",
    },
];

const FaqPage = () => {
    const [activeItem, setActiveItem] = useState("");

    const toggleItem = (id) => {
        setActiveItem(activeItem === id ? "" : id);
    };

    return (
        <section className="bg-broken-white px-5 py-16 text-center">
            <div className="mx-auto max-w-6xl">

                {/* Title */}
                <h1 className="mb-5 text-4xl font-bold text-ash md:text-5xl">
                    SOME FAQS
                </h1>

                {/* Description */}
                <p className="mx-auto mb-10 max-w-3xl text-base leading-7 text-black md:text-lg">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse vestibulum sem vitae laoreet suscipit.
                    Pellentesque velit magna, faucibus in justo sit amet,
                    congue ornare lorem.
                </p>

                {/* FAQ Items */}
                <div className="mx-auto max-w-4xl space-y-5">

                    {faqData.map((faq) => {
                        const isOpen = activeItem === faq.id;

                        return (
                            <div
                                key={faq.id}
                                className="overflow-hidden rounded-2xl bg-oren-muda text-left text-white shadow-md">

                                {/* Question */}
                                <button
                                    onClick={() => toggleItem(faq.id)}
                                    className="flex w-full items-center justify-between
                                        px-6 py-5 text-left
                                        transition-all duration-300">
                                        
                                    <span className="text-base font-semibold md:text-lg">
                                        {faq.question}
                                    </span>

                                    <span className="text-2xl font-bold">
                                        {isOpen ? "−" : "+"}
                                    </span>

                                </button>

                                {/* Answer */}
                                <div
                                    className={`
                                        grid transition-all duration-300
                                        ${isOpen
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0"
                                        }
                                    `}
                                >

                                    <div className="overflow-hidden">

                                        <p
                                            className="
                                                px-6 pb-5
                                                text-sm leading-7
                                                md:text-base
                                            "
                                        >
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FaqPage;