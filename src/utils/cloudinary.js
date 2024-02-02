import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // console.log("reached", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // console.log("File has been uploded ", response.url);
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
};

const deleteFromCloudinary = async (cloudinaryUrl) => {
    try {
        const publicId = cloudinary.utils.extractPublicId(cloudinaryUrl);

        const result = await cloudinary.uploader.destroy(publicId);

        console.log(result);

        if (result.result === "ok") {
            console.log("Image deleted successfully.");
        } else {
            console.error("Failed to delete image:", result);
        }
    } catch (error) {
        throw new ApiError(
            500,
            error?.message,
            "Cloudinary image deletion unsuccessful"
        );
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
