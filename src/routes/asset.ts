import cloudinary from "@db/cloudinary"
import type { UploadApiResponse } from "cloudinary"
import Elysia, { t } from "elysia"
import { authMiddleware } from "../middleware/auth"

const assetRoutes = new Elysia({ prefix: "/asset" }).use(authMiddleware).post(
	"upload-image",
	async ({ user, body, set }) => {
		if (!user) {
			set.status = 401
			return {
				error: { message: "Unauthorized" },
				data: null,
			}
		}

		const { image, field } = body
		if (!image) {
			set.status = 400
			return {
				error: { message: "Image is required" },
				data: null,
			}
		}

		try {
			// Convert the uploaded file to a buffer
			const buffer = await image.arrayBuffer()

			// Upload buffer to Cloudinary
			const uploadResponse = await new Promise<UploadApiResponse | undefined>(
				(resolve, reject) => {
					cloudinary.uploader
						.upload_stream({ folder: "user_uploads" }, (error, result) => {
							if (error) reject(error)
							else resolve(result)
						})
						.end(Buffer.from(buffer))
				},
			)

			if (!uploadResponse) {
				throw new Error("Failed to upload image")
			}

			// Here you would typically save the image URL to your database
			return {
				data: {
					url: uploadResponse.secure_url,
					public_id: uploadResponse.public_id,
				},
				error: null,
			}
		} catch (error) {
			console.error("Error uploading to Cloudinary:", error)
			set.status = 500
			return {
				error: { message: "Failed to upload image" },
				data: null,
			}
		}
	},
	{
		body: t.Object({
			field: t.String(),
			image: t.File(),
		}),
	},
)

export { assetRoutes }
