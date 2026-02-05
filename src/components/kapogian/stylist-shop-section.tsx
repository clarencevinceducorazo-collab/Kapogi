import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export const StylistShopSection = () => {
  const products = [
    { id: 'stylist-shop-tee', name: 'TEE' },
    { id: 'stylist-shop-mug', name: 'MUG' },
    { id: 'stylist-shop-pad', name: 'PAD' },
    { id: 'stylist-shop-hoodie', name: 'Aluminum Plate' },
  ];

  const productImages = [
    "/images/shirtrot.gif",
    "/images/mugzrot.gif",
    "/images/padrot.gif",
    "/images/platerot.gif"
  ];

  const avatar = PlaceHolderImages.find(
    (img) => img.id === 'stylist-shop-avatar'
  );
  const charLeft = PlaceHolderImages.find(
    (img) => img.id === 'stylist-shop-char-left'
  );
  const charRight = PlaceHolderImages.find(
    (img) => img.id === 'stylist-shop-char-right'
  );

  return (
    <section className="relative bg-gradient-to-b from-[#FFC83D] to-[#EAC35F] pt-20 pb-48 lg:pb-56">
      <div className="container mx-auto relative z-10 text-center">
        <h2
          className="font-headline text-6xl md:text-8xl font-bold text-white uppercase mb-16"
          style={{ textShadow: '3px 3px 0 #000' }}
        >
          The Stylist Shop
        </h2>

        <div className="relative max-w-6xl mx-auto">
          {charLeft && (
            <div
              className="absolute -bottom-24 -left-20 z-20 hidden md:block"
              style={{ transform: 'translateX(-20%)' }}
            >
              <Image
                src="/images/long.png"
                alt={charLeft.description}
                width={300}
                height={450}
                className="object-contain"
                data-ai-hint={charLeft.imageHint}
              />
            </div>
          )}

          <div
            className="relative z-10 bg-primary rounded-3xl border-4 border-black p-6 md:p-8"
            style={{ boxShadow: '8px 8px 0px #000' }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-primary-foreground/20 pb-4 mb-6">
              <div className="flex items-center gap-4">
                {avatar && (
                  <Image
                    src="/images/KapogianLogo.webp"
                    alt={avatar.description}
                    width={50}
                    height={50}
                    className="rounded-full border-2 border-primary-foreground/50"
                    data-ai-hint={avatar.imageHint}
                  />
                )}
                <div className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold border-2 border-black">
                  HOLDERS ONLY ACCESS
                </div>
              </div>
              <p className="font-bold text-primary-foreground tracking-widest text-sm mt-4 md:mt-0">
                BRING YOUR CONFIDENCE WITH YOU EVERYDAY
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, index) => {
                const image = PlaceHolderImages.find(
                  (img) => img.id === product.id
                );
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border-4 border-black p-4 flex flex-col items-center justify-between text-center aspect-[3/4]"
                  >
                    <div className="relative w-full flex-grow mb-4">
                      {image && (
                        <Image
                          src={productImages[index]}
                          alt={image.description}
                          fill
                          className="object-contain"
                          data-ai-hint={image.imageHint}
                        />
                      )}
                    </div>
                    <p className="font-headline text-black text-xl font-bold">
                      {product.name}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 bg-[#FFC83D] rounded-2xl border-2 border-black flex flex-col md:flex-row items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  id="all-in-bundle"
                  className="w-6 h-6 border-2 border-black rounded-sm data-[state=checked]:bg-black"
                />
                <div className="text-center md:text-left">
                  <label
                    htmlFor="all-in-bundle"
                    className="font-headline text-black text-lg font-bold"
                  >
                    THE "ALL-IN" BUNDLE
                  </label>
                  <p className="text-sm text-black/80 font-bold">
                    Save 20% when you grab the whole set.
                  </p>
                </div>
              </div>
              <Button className="rounded-full bg-black text-white hover:bg-gray-800 font-bold text-base px-6 py-3 border-2 border-black w-full md:w-auto">
                UPGRADE (+10 SUI)
              </Button>
            </div>
          </div>

          {charRight && (
            <div
              className="absolute -bottom-24 -right-20 z-20 hidden md:block"
              style={{ transform: 'translateX(20%)' }}
            >
              <Image
                src="/images/longs.png"
                alt={charRight.description}
                width={300}
                height={450}
                className="object-contain"
                data-ai-hint={charRight.imageHint}
              />
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-auto z-0">
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-auto"
        >
          <path
            fill="hsl(var(--primary))"
            d="M0 15L40 18.7C80 22.3 160 29.3 240 30.2C320 31.1 400 25.8 480 24.3C560 22.8 640 25.1 720 21.7C800 18.3 880 9.2 960 10.3C1040 11.5 1120 23 1200 26.2C1280 29.3 1360 24.2 1400 21.7L1440 19.2V60H1400C1360 60 1280 60 1200 60C1120 60 1040 60 960 60C880 60 800 60 720 60C640 60 560 60 480 60C400 60 320 60 240 60C160 60 80 60 40 60H0V15Z"
          ></path>
        </svg>
      </div>
    </section>
  );
};
