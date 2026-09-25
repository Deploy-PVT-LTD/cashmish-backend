import multer from "multer";

const storage = multer.memoryStorage();
const EXCEL_MIME_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv",
];

const uploadExcel = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const isExcelMime = EXCEL_MIME_TYPES.includes(file.mimetype);
        const isExcelExt = /\.(xlsx|xls|csv)$/i.test(file.originalname || "");
        if (isExcelMime || isExcelExt) {
            cb(null, true);
        } else {
            cb(new Error("Please upload an Excel (.xlsx/.xls) or CSV file."), false);
        }
    },
});

export default uploadExcel;
