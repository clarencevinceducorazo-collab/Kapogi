import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';
import Image from 'next/image';

export default function WhitepaperPage() {
  return (
    <>
      <PageHeader />
      <div className="relative font-body min-h-screen pt-32 px-4 pb-12 antialiased">
        <div className="hidden md:block absolute inset-0 -z-10">
          <Image
            src="/images/kapogian_background.png"
            alt="Whitepaper background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="block md:hidden absolute inset-0 -z-10">
          <Image
            src="/images/kapogian_background.png"
            alt="Whitepaper background mobile"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="max-w-4xl mx-auto bg-white comic-border-thick rounded-3xl overflow-hidden toy-shadow-lg">
           <div className="p-8 border-b-4 border-black bg-yellow-300">
             <h1 className="font-headline text-4xl tracking-wide">The Pogi Protocol</h1>
             <p className="font-bold text-black/60">
               Kapogian Coin ($KPG) Whitepaper v2.2
             </p>
           </div>
           <div className="p-8 md:p-12 whitepaper-content">
            <h2>1. Executive Summary</h2>
            <p>
              In an era of hyper-curated social media and unrealistic standards, the modern man often finds himself in a "Confidence Deficit." Kapogian Coin ($KPG) is a decentralized initiative built on the SUI blockchain designed to bridge the gap between digital identity and self-worth.
            </p>
            <p>
              Unlike traditional meme coins that prioritize immediate liquidity over substance, $KPG follows a "Value-First" trajectory. We are building a four-year roadmap centered on high-end physical collectibles, strategic gaming, and a narrative that celebrates the "Pogi" (handsome/confident) nature in every man.
            </p>

            <h2>2. The Narrative: The Philosophy of "Pogi"</h2>
            <p>
              The word "Pogi" is more than just a physical description; it is a state of mind. It encompasses:
            </p>
            <ul>
              <li><strong>Diskarte (Resourcefulness):</strong> The ability to navigate life with wit.</li>
              <li><strong>Confidence:</strong> The audacity to be oneself without apology.</li>
              <li><strong>Style:</strong> The unique flair that makes every individual stand out.</li>
            </ul>
            <p>
              Our Mission: To create a "Pogi Nation" where digital assets serve as certificates of confidence, and where our community realizes that "Everyone is good-looking in their own way."
            </p>

            <h2>3. Phase I: The Digital-to-Physical Bridge (2026 - 2027)</h2>
            <p>
              Before the deployment of the $KPG token, the project will focus on establishing its brand through the Kapogian NFT Collection.
            </p>
            <h3>3.1 The "Phygital" 1-to-1 Experience</h3>
            <p>
              We believe ownership should be tangible. Every Kapogian NFT minted is a 1-to-1 unique asset. Ownership of the NFT grants the holder the exclusive right to purchase its physical counterpart—a design that will never be replicated for anyone else.
            </p>
            <p><strong>The Merch Suite:</strong></p>
            <ul>
              <li><strong>Signature Apparel:</strong> Premium T-shirts and Hoodie Jackets featuring the high-fidelity render of your specific NFT character.</li>
              <li><strong>The Pogi Vessel:</strong> Custom Mugs for the modern gentleman's daily grind.</li>
              <li><strong>Artifacts:</strong> Aluminum A4 Plates. These are high-durability, industrial-grade art pieces meant for wall mounting, serving as a permanent physical record of your digital identity.</li>
            </ul>

            <h2>4. Phase II: The Kapogian CardGame (2027)</h2>
            <p>
              In 2027, the ecosystem evolves into a competitive arena. The Kapogian Card Game (KCG) is a strategic tabletop-style digital game where your NFT is not just an avatar, but a deck commander.
            </p>
            <h3>4.1 Trait-Based MMR (Matchmaking Rating)</h3>
            <p>
              Innovation in KCG lies in our "Aura-based" MMR system. Traditional games rely solely on win/loss ratios. In KCG, your Matchmaking Rating and in-game power levels are dynamically influenced by the Traits of your NFT:
            </p>
            <ul>
              <li><strong>The "Jawline" Stat:</strong> Influences defensive capabilities.</li>
              <li><strong>The "Swagger" Trait:</strong> Affects the speed of card draws.</li>
              <li><strong>The "Charisma" Multiplier:</strong> Enhances the effects of "Pogi Move" special abilities.</li>
            </ul>
            <p>
              This creates a meta-game where holders seek out NFTs with specific trait combinations to climb the leaderboard.
            </p>

            <h2>5. Phase III: The $KPG Token Genesis (2028)</h2>
            <p>
              By 2028, with a proven community of NFT holders, gamers, and merch owners, the Kapogian Coin ($KPG) will be deployed on SUI.
            </p>
            <h3>5.1 Tokenomics</h3>
            <ul>
              <li><strong>Ticker:</strong> $KPG</li>
              <li><strong>Total Supply:</strong> 1,000,000,000 (1 Billion)</li>
              <li><strong>Chain:</strong> SUI (Leveraging its Object-Centric model for dynamic NFTs).</li>
            </ul>
            <h3>5.2 Core Utility</h3>
            <p>$KPG is the lifeblood of the Kapogian Economy:</p>
            <ul>
              <li><strong>In-Game Currency:</strong> $KPG is used to enter tournaments, purchase card packs, and "refine" NFT traits for the card game.</li>
              <li><strong>The Pogi Storefront:</strong> Our Merch Store will transition to $KPG as the native payment method, offering discounts to those who pay with the token.</li>
              <li><strong>Governance:</strong> Top holders (The "Pogi Council") will vote on future merch designs and game expansion packs.</li>
            </ul>

            <h2>6. Technical Framework: Why SUI?</h2>
            <p>
              The Kapogian project requires a blockchain that can handle "Living Assets." SUI’s unique architecture allows our NFTs to:
            </p>
            <ul>
              <li><strong>Evolve:</strong> As you win games in 2027, your NFT's on-chain metadata can update to reflect your growing "Aura."</li>
              <li><strong>Scale:</strong> Handling the high-volume transactions for global merch sales with sub-second finality.</li>
              <li><strong>Affordability:</strong> Low gas fees ensure that buying a $KPG-branded mug doesn't cost more in transaction fees than the product itself.</li>
            </ul>

            <h2>7. Roadmap</h2>
            <ul>
              <li><strong>2026:</strong> NFT Genesis & 1-to-1 Physical Merch Store Launch.</li>
              <li><strong>2027:</strong> Kapogian Card Game (KCG) Launch; Integration of Trait-Based MMR.</li>
              <li><strong>2028:</strong> $KPG Token Deployment; Full Ecosystem Integration; Global Pogi Nation Expansion.</li>
            </ul>

            <h2>8. Final Word</h2>
            <p>
              $KPG is a celebration of the individual. We are moving away from the "pump" culture to build a "Pogi" culture—one where your digital assets, your physical clothes, and your gaming skill all contribute to a singular narrative of confidence.
            </p>
            <p className="font-bold mt-4">Stay Pogi.</p>
            <p className="text-xs text-slate-500 mt-6">
              <strong>Disclaimer:</strong> $KPG is a utility and meme token. Engagement with digital assets involves risk. The roadmap is subject to community-driven adjustments and technical developments.
            </p>
          </div>
        </div>
      </div>
      <PageFooter />
    </>
  );
}
