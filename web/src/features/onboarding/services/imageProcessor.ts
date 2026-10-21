const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export type MatchImages = {
  full: Blob;
  thumb: Blob;
};

async function generateWebP(
  image: ImageBitmap,
  width: number,
  height: number,
  maxBytes: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Image processing unavailable");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Center-crop to 4:5.
  const ratio = 4 / 5;

  const sourceWidth = Math.min(
    image.width,
    image.height * ratio
  );

  const sourceHeight = Math.min(
    image.height,
    image.width / ratio
  );

  ctx.drawImage(
    image,
    (image.width - sourceWidth) / 2,
    (image.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height
  );

  // Attempt progressively smaller encodings.
  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Image encoding failed"));
        },
        "image/webp",
        quality
      );
    });

    if (blob.type !== "image/webp") {
      throw new Error("WebP encoding is not supported");
    }

    if (blob.size > 0 && blob.size <= maxBytes) {
      return blob;
    }
  }

  throw new Error("Image could not be compressed enough");
}

export async function createMatchImages(
  file: File
): Promise<MatchImages> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Choose a JPEG, PNG or WebP image");
  }

  if (file.size === 0 || file.size > MAX_PHOTO_SIZE) {
    throw new Error("Photo must be under 5 MB");
  }

  let image: ImageBitmap;

  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read the selected image");
  }

  try {
    if (!image.width || !image.height) {
      throw new Error("Invalid image dimensions");
    }

    if (image.width * image.height > 32_000_000) {
      throw new Error("Image resolution is too large");
    }

    const full = await generateWebP(
      image,
      800,
      1000,
      1024 * 1024
    );

    const thumb = await generateWebP(
      image,
      320,
      400,
      256 * 1024
    );

    return { full, thumb };
  } finally {
    image.close();
  }
}