import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST() {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "cardforge-3d/uploads";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET ?? "",
  );

  return NextResponse.json({
    timestamp,
    folder,
    signature,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
