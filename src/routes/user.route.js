import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser)

// Secured Routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/get-current-user").get(verifyJWT, getCurrentUser)
router.route("/update-user").post(verifyJWT, updateUserDetails)
router.route("/update-user-avatar").post(upload.single("avatar"),verifyJWT, updateUserAvatar)
router.route("/update-user-coverImage").post(upload.single("coverImage"),verifyJWT, updateUserCoverImage)


export default router;
