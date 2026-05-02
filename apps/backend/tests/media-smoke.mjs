import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] ??= value;
}

const { getImageKit, generateUploadAuth, getFileDetails, deleteFile } =
  await import("../src/lib/imagekit.ts");

const imagekit = getImageKit();
const testRun = `media-smoke-${Date.now()}`;
const userTag = `user:${testRun}`;
const uploaded = [];

try {
  const auth = generateUploadAuth(testRun);
  console.log(
    JSON.stringify({
      step: "upload_auth",
      tokenLength: auth.token.length,
      expiresInSecondsApprox: auth.expire - Math.floor(Date.now() / 1000),
      signatureLength: auth.signature.length,
    }),
  );

  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  const image = await imagekit.upload({
    file: pngBase64,
    fileName: `${testRun}-image.png`,
    folder: "/delta-smoke-tests",
    tags: `${userTag},media-smoke,image`,
    useUniqueFileName: true,
  });
  uploaded.push(image.fileId);
  const imageDetails = await getFileDetails(image.fileId);
  console.log(
    JSON.stringify({
      step: "image_upload",
      fileId: image.fileId,
      fileType: image.fileType,
      mime: imageDetails.mime,
      size: imageDetails.size,
      width: imageDetails.width,
      height: imageDetails.height,
    }),
  );

  const video = await imagekit.upload({
    file: "https://samplelib.com/preview/mp4/sample-5s.mp4",
    fileName: `${testRun}-video.mp4`,
    folder: "/delta-smoke-tests",
    tags: `${userTag},media-smoke,video`,
    useUniqueFileName: true,
  });
  uploaded.push(video.fileId);
  const videoDetails = await getFileDetails(video.fileId);
  console.log(
    JSON.stringify({
      step: "video_upload",
      fileId: video.fileId,
      fileType: video.fileType,
      mime: videoDetails.mime,
      size: videoDetails.size,
      width: videoDetails.width,
      height: videoDetails.height,
      duration: videoDetails.duration,
    }),
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const listed = await imagekit.listFiles({ tags: userTag, limit: 10 });
  console.log(
    JSON.stringify({
      step: "list_by_user_tag",
      count: listed.length,
      fileIds: listed.map((file) => file.fileId),
    }),
  );

  if (listed.length < 2) {
    throw new Error("Expected ImageKit tag listing to return both smoke files");
  }
} finally {
  const cleanup = [];
  for (const fileId of uploaded) {
    try {
      await deleteFile(fileId);
      cleanup.push({ fileId, deleted: true });
    } catch (error) {
      cleanup.push({
        fileId,
        deleted: false,
        error: error?.message || String(error),
      });
    }
  }
  console.log(JSON.stringify({ step: "cleanup", cleanup }));
}

