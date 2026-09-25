import multer from "multer";

// Admin-uploaded USPS shipping label PDF — memory storage, forwarded straight
// to Cloudinary (resource_type: raw) by the controller, same pattern as
// uploadExcel.js.
const storage = multer.memoryStorage();

const uploadLabel = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const isPdfMime = file.mimetype === "application/pdf";
        const isPdfExt = /\.pdf$/i.test(file.originalname || "");
        if (isPdfMime || isPdfExt) {
            cb(null, true);
        } else {
            cb(new Error("Please upload the shipping label as a PDF."), false);
        }
    },
});

export default uploadLabel;
