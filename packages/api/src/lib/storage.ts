import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "botly-documents"

export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" || true,
})

export async function uploadFile(
  key: string,
  data: Buffer | Uint8Array,
  contentType = "application/octet-stream"
): Promise<{ key: string; bucket: string; size: number }> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  )

  return {
    key,
    bucket: S3_BUCKET_NAME,
    size: data.byteLength,
  }
}

export async function getFile(
  key: string
): Promise<{ data: Uint8Array; contentType?: string }> {
  const res = await s3Client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
  )

  if (!res.Body) {
    throw new Error(`File not found: ${key}`)
  }

  const byteArray = await res.Body.transformToByteArray()
  return {
    data: byteArray,
    contentType: res.ContentType,
  }
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
  )
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}
