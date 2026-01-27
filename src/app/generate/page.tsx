
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Sparkles,
  Ghost,
  Shirt,
  Coffee,
  MousePointer2,
  ArrowRight,
  Truck,
  Utensils,
  ArrowLeft,
  LoaderCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CharacterMetadata {
  name: string;
  description: string;
  attributes: {
    cuteness: number;
    confidence: number;
    tiliFactor: number;
    luzon: number;
    visayas: number;
    mindanao: number;
    hairAmount: number;
    facialHair: number;
    clothingStyle: number;
    hairColor: number;
    eyewear: number;
    skinColor: number;
    bodyFat: number;
    posture: number;
    holdingItem: string;
  };
}


export default function GeneratorPage() {
  const [page, setPage] = useState('generator');

  // Generation State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [characterName, setCharacterName] = useState('');
  const [cuteness, setCuteness] = useState(85);
  const [confidence, setConfidence] = useState(40);
  const [tiliFactor, setTiliFactor] = useState(92);
  const [luzon, setLuzon] = useState(60);
  const [visayas, setVisayas] = useState(20);
  const [mindanao, setMindanao] = useState(20);
  const [hairAmount, setHairAmount] = useState(25);
  const [facialHair, setFacialHair] = useState(0);
  const [clothingStyle, setClothingStyle] = useState(25);
  const [hairColor, setHairColor] = useState(0);
  const [eyewear, setEyewear] = useState(0);
  const [skinColor, setSkinColor] = useState(0);
  const [bodyFat, setBodyFat] = useState(25);
  const [posture, setPosture] = useState(25);
  const [holdingItem, setHoldingItem] = useState('None');
  
  // Result State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedLore, setGeneratedLore] = useState<string | null>(null);
  const [generatedName, setGeneratedName] = useState<string>('');


  const navigate = (targetId: string) => {
    setPage(targetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const renderMarkdown = (text: string | null) => {
    if (!text) return null;
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br />'); // Newlines
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  /**
   * Generate Filipino name using the API route
   */
  const generateName = async (): Promise<string> => {
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'name',
          prompt: 'Generate a single unique and creative name for a Filipino male character. The name should be a traditional or modern Filipino name. Do not include any other text, just the name.'
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate name');
      
      const result = await response.json();
      return result.text?.replace(/["']+/g, '') || "Pogi";
    } catch (e) {
      console.error("Name generation failed:", e);
      return "Pogi";
    }
  };

  /**
   * Generate country name using the API route
   */
  const generateCountry = async (): Promise<string> => {
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'country',
          prompt: 'Generate a name of a foreign country, do not include any other text.'
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate country');
      
      const result = await response.json();
      return result.text?.replace(/["']+/g, '') || "a foreign land";
    } catch (e) {
      console.error("Country generation failed:", e);
      return "a foreign land";
    }
  };

  /**
   * Generate lore text using the API route
   */
  const generateLore = async (name: string, originDesc: string): Promise<string> => {
    try {
      const promptText = `
        You are a lore generator for a fictional universe called "Kapogian Chibis".
        A Kapogian Chibi is a confident, good-looking Filipino male.
        Their stats are: Cuteness is ${cuteness} out of 100, Confidence is ${confidence} out of 100, and Tili Factor is ${tiliFactor} out of 100.
        Create a detailed lore for a Kapogian Chibi named **${name}**, a ${originDesc}.
        The lore should be about 150 words and include a backstory, personality description influenced by their stats, a heroic anecdote, and a concluding sentence.
        Do not mention the exact stat numbers in the narrative. Focus on the creative description.
        Use markdown formatting like bolding and italics to make the text stylish.`;

      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'lore',
          prompt: promptText
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate lore');
      
      const result = await response.json();
      return result.text || 'Failed to generate lore.';
    } catch (e) {
      console.error("Lore generation failed:", e);
      return 'Failed to generate lore.';
    }
  };

  /**
   * Build character prompt
   */
  const buildCharacterPrompt = (name: string, originDesc: string): string => {
    let statDescriptors = "";
    
    if (cuteness > 75) {
      statDescriptors += ", large innocent eyes, soft round face";
    } else if (cuteness < 25) {
      statDescriptors += ", mischievous smile, slightly narrowed eyes";
    }

    if (confidence > 75) {
      statDescriptors += ", a bold and smirking pose, puffed-out chest";
    } else if (confidence < 25) {
      statDescriptors += ", a shy and uncertain smile, hands in pockets";
    }

    if (tiliFactor > 75) {
      statDescriptors += ", a heart-throb hairstyle, dazzling infectious smile";
    } else if (tiliFactor < 25) {
      statDescriptors += ", a subtle, cool expression, reserved vibe";
    }

    let hairDescriptor = "medium length hair";
    if (hairAmount <= 5) hairDescriptor = "bald";
    else if (hairAmount <= 15) hairDescriptor = "short spiky hair";
    else if (hairAmount <= 35) hairDescriptor = "medium length hair";
    else hairDescriptor = "long, flowing hair";

    let facialHairDescriptor = "clean shaven";
    if (facialHair > 5) facialHairDescriptor = "light stubble";
    if (facialHair > 20) facialHairDescriptor = "short, neat beard";
    if (facialHair > 40) facialHairDescriptor = "long, full beard and a stylish mustache";

    let clothingDescriptor = "casual streetwear";
    if (clothingStyle <= 5) clothingDescriptor = "only a sando and shorts";
    else if (clothingStyle <= 15) clothingDescriptor = "simple t-shirt and shorts";
    else if (clothingStyle <= 30) clothingDescriptor = "stylish streetwear with a hoodie";
    else if (clothingStyle <= 45) clothingDescriptor = "formal attire with a crisp polo";
    else clothingDescriptor = "elegant filipino formal attire, like a barong tagalog";
    
    let hairColorDescriptor = "black hair";
    if (hairColor > 5) hairColorDescriptor = "dark brown hair";
    if (hairColor > 15) hairColorDescriptor = "light brown hair";
    if (hairColor > 30) hairColorDescriptor = "blonde hair";
    if (hairColor > 45) hairColorDescriptor = "white hair";

    let eyewearDescriptor = "no eyewear";
    if (eyewear > 5) eyewearDescriptor = "stylish eyeglasses";
    if (eyewear > 20) eyewearDescriptor = "cool sunglasses";
    if (eyewear > 40) eyewearDescriptor = "futuristic sporty eyewear";
    
    let skinColorDescriptor = "kayumangi skin";
    if (skinColor > 25) skinColorDescriptor = "dark-skinned, Aeta-like skin color";
    
    let bodyFatDescriptor = "";
    if (bodyFat <= 15) bodyFatDescriptor = "thin and slender body";
    else if (bodyFat <= 35) bodyFatDescriptor = "average body type";
    else bodyFatDescriptor = "chubby and plump body";
    
    let postureDescriptor = "";
    if (cuteness > 30 && confidence > 30) {
      if (posture === 50) {
        postureDescriptor = "striking a finger heart pose with a proud smile";
      } else if (posture >= 20) {
        postureDescriptor = "flexing his muscles and striking a charismatic pose";
      } else {
        postureDescriptor = "with a casual, charming pose, slightly flexing";
      }
    } else {
      if (posture === 50) {
        postureDescriptor = "standing very well-postured and proud";
      } else if (posture > 20) {
        postureDescriptor = "with an upright, well-postured stance";
      } else {
        postureDescriptor = "with a very casual, relaxed posture";
      }
    }
    
    let holdingItemDescriptor = "not holding anything";
    switch (holdingItem) {
      case 'Cash':
        holdingItemDescriptor = "holding a wad of cash";
        break;
      case 'Random Food':
        holdingItemDescriptor = "holding a plate of random Filipino food like Chicken Adobo, Pork BBQ, and Lechon";
        break;
      case 'Random Bouquet of Flowers':
        holdingItemDescriptor = "holding a random bouquet of flowers, including roses, tulips, and sunflowers";
        break;
      case 'Random Home Utensils':
        holdingItemDescriptor = "holding a random home utensil, such as a broomstick or a pan";
        break;
    }

    return `full body shot of a cute chubby chibi pinoy boy named ${name}, ${originDesc}, with ${skinColorDescriptor}, with ${hairColorDescriptor} and ${hairDescriptor}, ${facialHairDescriptor}, wearing ${clothingDescriptor}, with ${eyewearDescriptor}, ${bodyFatDescriptor}, ${postureDescriptor}, ${holdingItemDescriptor}, showing confident pose, smiling. Kapogian meme, high quality, digital art, 4k, simple white background.`;
  };
  
  const handleGenerate = async () => {
    // If no character name is provided, generate one using the AI.
    let nameToUse = characterName;
    setLoading(true);
    setError('');

    if (!nameToUse) {
      nameToUse = await generateName();
      setGeneratedName(nameToUse);
    } else {
      setGeneratedName(nameToUse);
    }

    // Determine the character's origin
    let originDescription = "Filipino";
    if (luzon === 0 && visayas === 0 && mindanao === 0) {
      const origin = await generateCountry();
      originDescription = `a naturalized Filipino from ${origin}`;
    } else {
      const origins = [
        { region: "Luzon", value: luzon },
        { region: "Visayas", value: visayas },
        { region: "Mindanao", value: mindanao }
      ];
      origins.sort((a, b) => b.value - a.value);
      originDescription = `a native of the ${origins[0].region} region of the Philippines`;
    }

    try {
      const fullPrompt = buildCharacterPrompt(nameToUse, originDescription);

      const imagePromise = fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });

      const lorePromise = generateLore(nameToUse, originDescription);

      const [imageResponse, lore] = await Promise.all([imagePromise, lorePromise]);

      if (!imageResponse.ok) {
        throw new Error('Failed to generate image');
      }

      const result = await imageResponse.json();
      const base64Data = result?.base64Image;
      
      if (!base64Data) {
        throw new Error('No image data received from the API.');
      }
      
      setGeneratedImage(`data:image/png;base64,${base64Data}`);
      setGeneratedLore(lore);

      navigate('page-preview');

    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(err.message || 'Failed to generate character. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="generate-page min-h-screen p-4 md:p-8 flex items-center justify-center text-lg text-black antialiased">
      <main className="relative w-full max-w-4xl bg-white border-4 border-black rounded-3xl hard-shadow overflow-hidden flex flex-col">
        <header className="bg-black text-white p-4 border-b-4 border-black flex justify-between items-center">
          <div className="w-1/3">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors">
                <ArrowLeft className="w-6 h-6" />
                <span className="font-display font-semibold tracking-tight text-lg hidden md:inline">Home</span>
            </Link>
          </div>
          <div className="w-1/3 flex justify-center items-center gap-2">
            <Package className="w-6 h-6 text-yellow-400" />
            <span className="font-display font-semibold tracking-tight text-xl text-yellow-400">KAPOGIAN WORLD</span>
          </div>
          <div className="w-1/3 flex justify-end gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
            <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></div>
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
          </div>
        </header>

        <div className="p-0 bg-stone-50 min-h-[600px] relative">
          <section id="page-generator" className={cn('page-section p-6 md:p-8 flex flex-col gap-8 h-full', { 'hidden': page !== 'generator' })}>
            <div className="text-center space-y-2">
                <h1 className="font-display text-4xl font-semibold tracking-tight uppercase">Kapogian Image Generator</h1>
                <p className="text-xl text-stone-600 font-medium max-w-lg mx-auto">Generate a unique character image and its corresponding lore for your collection.</p>
            </div>

            <div className="border-4 border-black rounded-2xl bg-white hard-shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
                <div className="absolute top-2 right-2 rotate-12 bg-yellow-400 text-black text-xs font-bold px-2 py-1 border-2 border-black rounded shadow-[2px_2px_0px_#000]">NEW!</div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-display font-semibold text-xl uppercase">Character Name</label>
                        <input 
                            type="text" 
                            placeholder="Leave blank for random..." 
                            className="w-full border-4 border-black rounded-lg p-3 text-lg font-medium outline-none focus:ring-4 ring-yellow-300 transition-all placeholder:text-stone-400"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4 p-4 border-4 border-stone-200 border-dashed rounded-xl bg-stone-50">
                        <h3 className="font-display font-semibold text-lg text-stone-500 uppercase">Enchantments</h3>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Cuteness</span><span>{cuteness}</span></div>
                            <input type="range" min="0" max="100" value={cuteness} onChange={(e) => setCuteness(Number(e.target.value))} className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Confidence</span><span>{confidence}</span></div>
                            <input type="range" min="0" max="100" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Tili Factor</span><span>{tiliFactor}</span></div>
                            <input type="range" min="0" max="100" value={tiliFactor} onChange={(e) => setTiliFactor(Number(e.target.value))} className="w-full" />
                        </div>
                    </div>

                     <div className="space-y-4 p-4 border-4 border-stone-200 border-dashed rounded-xl bg-stone-50">
                        <h3 className="font-display font-semibold text-lg text-stone-500 uppercase">Origin Stats</h3>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Luzon</span><span>{luzon}</span></div>
                            <input type="range" min="0" max="50" value={luzon} onChange={(e) => setLuzon(Number(e.target.value))} className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Visayas</span><span>{visayas}</span></div>
                            <input type="range" min="0" max="50" value={visayas} onChange={(e) => setVisayas(Number(e.target.value))} className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Mindanao</span><span>{mindanao}</span></div>
                            <input type="range" min="0" max="50" value={mindanao} onChange={(e) => setMindanao(Number(e.target.value))} className="w-full" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="border-4 border-black bg-blue-50 rounded-xl p-5 space-y-4 relative">
                        <div className="absolute -top-4 left-4 bg-black text-white px-3 py-1 font-display font-semibold text-sm border-2 border-white rounded-full">PORMA CONTROLS</div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-2">
                             <div className="space-y-1">
                                <label className="text-sm font-semibold">Clothing Style: {clothingStyle}</label>
                                <input type="range" min="0" max="50" value={clothingStyle} onChange={(e) => setClothingStyle(Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Hair Amount: {hairAmount}</label>
                                <input type="range" min="0" max="50" value={hairAmount} onChange={(e) => setHairAmount(Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Hair Color: {hairColor}</label>
                                <input type="range" min="0" max="50" value={hairColor} onChange={(e) => setHairColor(Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Facial Hair: {facialHair}</label>
                                <input type="range" min="0" max="50" value={facialHair} onChange={(e) => setFacialHair(Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Eyewear: {eyewear}</label>
                                <input type="range" min="0" max="50" value={eyewear} onChange={(e) => setEyewear(Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Skin Tone: {skinColor}</label>
                                <input type="range" min="0" max="50" value={skinColor} onChange={(e) => setSkinColor(Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Body Fat: {bodyFat}</label>
                                <input type="range" min="0" max="50" value={bodyFat} onChange={(e) => setBodyFat(Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Posture: {posture}</label>
                                <input type="range" min="0" max="50" value={posture} onChange={(e) => setPosture(Number(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    
                        <div className="space-y-1 pt-2">
                            <label className="text-sm font-semibold">Held Item (Food/Flower)</label>
                             <div className="relative">
                                <Utensils className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                                <select value={holdingItem} onChange={(e) => setHoldingItem(e.target.value)} className="w-full border-2 border-black rounded-lg p-2 pl-10 bg-white font-medium">
                                    <option value="None">Nothing</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Random Food">Filipino Food</option>
                                    <option value="Random Bouquet of Flowers">Flowers</option>
                                    <option value="Random Home Utensils">Home Utensils</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={handleGenerate} 
                            disabled={loading}
                            className="w-full bg-green-400 text-black border-4 border-black rounded-xl py-4 px-6 text-2xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hard-shadow-hover transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <LoaderCircle className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                            {loading ? 'Generating...' : 'Generate Character'}
                        </button>
                    </div>
                     {error && (
                        <div className="mt-4 text-sm text-center bg-red-100 p-3 rounded-lg border border-red-300 text-red-700">
                        {error}
                        </div>
                    )}
                </div>
            </div>
          </section>

          <section id="page-preview" className={cn('page-section flex flex-col h-full', { 'hidden': page !== 'page-preview' })}>
                
                <div className="flex flex-col md:flex-row border-b-4 border-black">
                    <div className="w-full md:w-1/2 p-8 bg-stone-100 flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black min-h-[300px]">
                        {loading && <LoaderCircle className="w-16 h-16 animate-spin text-stone-400" />}
                        {!loading && generatedImage && <Image src={generatedImage} alt="Kapogian Character" width={256} height={256} className="rounded-full border-4 border-black hard-shadow" />}
                        {!loading && !generatedImage && <Image src="/images/KPG.png" alt="Kapogian Character" width={256} height={256} className="rounded-full border-4 border-black hard-shadow" />}
                    </div>
                    <div className="w-full md:w-1/2 p-8 bg-white flex flex-col">
                        <div className="mb-4">
                            <h2 className="font-display text-2xl font-semibold tracking-tight uppercase border-b-4 border-yellow-300 inline-block">{generatedName}</h2>
                        </div>
                        <div className="flex-grow bg-stone-50 border-2 border-stone-200 rounded-lg p-4 font-medium text-stone-700">
                           {loading && "Generating lore..."}
                           {!loading && generatedLore ? renderMarkdown(generatedLore) : "Lore will appear here. The backstory is generated based on your stats..."}
                        </div>
                    </div>
                </div>

                <div className="stripe-bg p-6 md:p-8 flex-grow flex flex-col justify-center relative border-t-4 border-black">
                    <div className="flex justify-between items-end mb-6 relative z-10">
                        <div>
                            <h2 className="font-display text-4xl font-semibold text-white tracking-tight drop-shadow-[4px_4px_0_#000]" style={{WebkitTextStroke: '1.5px black'}}>THE STYLIST SHOP</h2>
                            <div className="bg-white border-2 border-black px-2 py-0.5 rounded text-xs font-bold inline-block mt-1 uppercase tracking-wide shadow-[2px_2px_0px_rgba(0,0,0,1)]">Holders Only Access</div>
                        </div>
                        <span className="font-display font-semibold text-white text-lg drop-shadow-md">FALL COLLECTION</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <Shirt className="w-10 h-10 text-stone-800" />
                            </div>
                            <span className="font-display font-semibold uppercase">Tee</span>
                        </button>
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <Coffee className="w-10 h-10 text-stone-800" />
                            </div>
                            <span className="font-display font-semibold uppercase">Mug</span>
                        </button>
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <MousePointer2 className="w-10 h-10 text-stone-800" />
                            </div>
                            <span className="font-display font-semibold uppercase">Pad</span>
                        </button>
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <div className="w-10 h-10 rounded-full border-2 border-stone-800"></div>
                            </div>
                            <span className="font-display font-semibold uppercase">Plate</span>
                        </button>
                    </div>

                    <div className="bg-yellow-400 border-4 border-black rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hard-shadow-sm relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white border-4 border-black rounded-md"></div>
                            <div className="flex flex-col">
                                <span className="font-display font-semibold text-xl uppercase leading-none">The "All-In" Bundle</span>
                                <span className="text-sm font-medium leading-tight">Save 20% when you grab the whole set.</span>
                            </div>
                        </div>
                        <button className="bg-black text-white font-display font-semibold px-6 py-3 rounded-lg border-2 border-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform uppercase text-base">
                            Upgrade (+10 SUI)
                        </button>
                    </div>
                    
                    <div className="absolute -bottom-4 -right-4 z-20">
                         <button onClick={() => navigate('page-shipping')} className="bg-pink-500 text-white border-4 border-black rounded-full w-20 h-20 flex items-center justify-center hard-shadow hover:rotate-12 transition-transform">
                            <ArrowRight className="w-10 h-10 stroke-[2.5]" />
                        </button>
                    </div>
                </div>
            </section>

             <section id="page-shipping" className={cn('page-section p-8 flex flex-col items-center justify-center h-full min-h-[600px] bg-sky-100', { 'hidden': page !== 'page-shipping' })}>
                <div className="w-full max-w-md bg-white border-4 border-black rounded-2xl p-8 hard-shadow-sm relative">
                    <div className="absolute -top-6 -left-6 bg-red-500 text-white font-display font-semibold px-4 py-2 rotate-[-6deg] border-4 border-black rounded-lg shadow-md uppercase">Fragile!</div>

                    <h2 className="font-display text-3xl font-semibold mb-6 border-b-4 border-stone-200 pb-2">Shipping Details</h2>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="font-semibold uppercase text-sm tracking-wide">Full Name</label>
                            <input type="text" className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-semibold uppercase text-sm tracking-wide">Contact Number</label>
                            <input type="text" className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-semibold uppercase text-sm tracking-wide">Full Address</label>
                            <textarea rows={3} className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all resize-none"></textarea>
                        </div>
                    </div>

                    <button onClick={() => navigate('page-receipt')} className="mt-8 w-full bg-blue-500 text-white border-4 border-black rounded-xl py-3 text-xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hard-shadow-hover transition-all flex items-center justify-center gap-2">
                        <Truck className="w-6 h-6" />
                        Ship It
                    </button>
                </div>
            </section>

             <section id="page-receipt" className={cn('page-section p-8 flex flex-col items-center justify-center h-full min-h-[600px] bg-green-200', { 'hidden': page !== 'page-receipt' })}>
                <div className="w-full max-w-sm bg-white border-x-4 border-t-4 border-b-[12px] border-dotted border-black rounded-t-xl relative p-6 shadow-2xl">
                    
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-200 rounded-full border-4 border-black"></div>

                    <div className="text-center mb-6 border-b-2 border-dashed border-stone-300 pb-4">
                        <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">Order Receipt</h2>
                        <p className="text-stone-500 font-medium text-sm mt-1">Order #KAP-8821</p>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="w-20 h-20 bg-stone-100 border-2 border-black rounded-md shrink-0 overflow-hidden">
                          <Image src="/images/KPG.png" alt="Kapogian Character" width={80} height={80} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-semibold text-lg">Kapogian #442</span>
                            <span className="text-sm text-stone-500">Includes Digital Asset</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6 text-base font-medium">
                        <div className="flex justify-between">
                            <span className="text-stone-600">Merch Bundle</span>
                            <span>Included</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-600">Shipping</span>
                            <span>Free</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t-2 border-black">
                            <span>Total</span>
                            <span>10 SUI</span>
                        </div>
                    </div>

                    <div className="bg-stone-100 border-2 border-stone-300 p-2 text-center rounded mb-6">
                        <span className="text-xs font-bold uppercase text-stone-500 tracking-widest">Status: Pending</span>
                    </div>

                    <button onClick={() => navigate('page-generator')} className="w-full bg-white text-black border-4 border-black rounded-xl py-3 text-lg font-display font-semibold uppercase tracking-tight hover:bg-stone-100 transition-all">
                        Make Another
                    </button>

                    <div className="absolute bottom-20 right-4 border-4 border-red-500 text-red-500 rounded-full w-24 h-24 flex items-center justify-center font-bold text-xl uppercase rotate-[-20deg] opacity-80 pointer-events-none" style={{mixBlendMode: 'multiply'}}>
                        PAID
                    </div>
                </div>
            </section>
        </div>
      </main>
    </div>
  );
}

