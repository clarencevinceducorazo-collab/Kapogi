import { HelpCircle } from 'lucide-react';

const faqData = [
  {
    question: 'IS EVERY KAPOGIAN UNIQUE?',
    answer: 'Yes. 100% deterministic logic ensures no duplicates.',
  },
  {
    question: 'CAN I SELL MY RECEIPT?',
    answer: "No. It's a Soulbound Token (SBT) tied to your identity.",
  },
  {
    question: 'CAN I SELL MY NFT?',
    answer: 'Yes, you can sell your NFT.',
  },
];

export const FaqSection = () => {
  return (
    <section className="bg-primary text-primary-foreground py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="relative mb-12 md:mb-16 text-center">
          <div
            className="inline-block bg-primary border-[6px] border-black p-4"
            style={{ boxShadow: '12px 12px 0 #000' }}
          >
            <h2
              className="font-headline text-3xl md:text-5xl lg:text-6xl font-bold text-white uppercase"
              style={{ textShadow: '3px 3px 0 #000' }}
            >
              FAQ (FREQUENTLY ASKED QUESTION)
            </h2>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="bg-white text-black rounded-2xl border-4 border-black p-5"
              style={{ boxShadow: '8px 8px 0px #000' }}
            >
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-base md:text-lg -mt-1">
                    {item.question}
                  </h3>
                  <p className="text-black/70 text-sm md:text-base">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
