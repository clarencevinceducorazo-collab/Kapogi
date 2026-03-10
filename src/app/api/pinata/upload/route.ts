import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";
import "server-only";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL!,
});

export const maxDuration = 120;

export async function GET() {
  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 120,
      mimeTypes: ["image/*"],
      maxFileSize: 209715200,
    });
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Presign error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}