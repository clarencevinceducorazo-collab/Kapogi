
interface PinataMetadata {
    name: string;
    description: string;
    attributes: any;
}

export async function uploadCharacterToIPFS(imageBlob: Blob, metadata: PinataMetadata): Promise<{ imageUrl: string }> {
    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

    if (!pinataJWT) {
        throw new Error("Pinata JWT environment variable is not set.");
    }

    try {
        // 1. Upload image file
        const imageData = new FormData();
        imageData.append('file', imageBlob, `${metadata.name.replace(/\s/g, '-')}.png`);

        const imageUploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pinataJWT}`,
            },
            body: imageData,
        });

        if (!imageUploadRes.ok) {
            const errorBody = await imageUploadRes.text();
            throw new Error(`Failed to upload image to IPFS: ${imageUploadRes.status} ${errorBody}`);
        }

        const imageUploadData = await imageUploadRes.json();
        const imageIpfsHash = imageUploadData.IpfsHash;
        console.log('✅ Image uploaded to IPFS:', imageIpfsHash);

        // 2. Create and upload metadata file
        const fullMetadata = {
            name: metadata.name,
            description: metadata.description,
            image: `ipfs://${imageIpfsHash}`, // Standard IPFS URI for the image
            attributes: metadata.attributes,
        };

        const metadataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pinataJWT}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pinataContent: fullMetadata,
                pinataMetadata: {
                    name: `${metadata.name} NFT Metadata`,
                }
            }),
        });

        if (!metadataRes.ok) {
            const errorBody = await metadataRes.text();
            throw new Error(`Failed to upload metadata to IPFS: ${metadataRes.status} ${errorBody}`);
        }
        const metadataUploadData = await metadataRes.json();
        const metadataIpfsHash = metadataUploadData.IpfsHash;
        console.log('✅ Metadata uploaded to IPFS:', metadataIpfsHash);
        
        // Return the IPFS URI for the metadata, which is standard for NFTs.
        const finalUrl = `ipfs://${metadataIpfsHash}`;
        
        return { imageUrl: finalUrl };

    } catch (error) {
        console.error("Error uploading to IPFS:", error);
        throw error;
    }
}
