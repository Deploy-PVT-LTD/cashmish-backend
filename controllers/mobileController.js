import { Mobile } from "../models/mobileModel.js";
import { MobileRequest } from "../models/mobileRequestModel.js";
import * as XLSX from "xlsx";

// Helper to check if user is superadmin
const isSuperAdmin = (req) => req.user && req.user.role === 'superadmin';

// Normalizes casing on known model-line words (Apple's own stylization:
// "iPhone", "Pro", "Max", "Plus", "Air" — except "mini", which Apple always
// writes lowercase, e.g. "iPhone 13 mini") and trims stray whitespace, so
// admin-entered names display consistently everywhere without needing manual
// cleanup. Any word not in the list (brand-specific terms, numbers, etc.)
// passes through unchanged.
const MODEL_WORD_CASE_MAP = {
  iphone: 'iPhone',
  pro: 'Pro',
  max: 'Max',
  plus: 'Plus',
  air: 'Air',
  mini: 'mini',
};
const normalizeModelName = (raw) => {
  if (typeof raw !== 'string') return raw;
  const words = raw.trim().replace(/\s+/g, ' ').split(' ');
  return words.map((w) => MODEL_WORD_CASE_MAP[w.toLowerCase()] ?? w).join(' ');
};

//   ADD MOBILE (ADMIN/SUPERADMIN)
export const addMobile = async (req, res) => {
  try {
    const { category, brand, basePrice, basePriceLocked, image, deductionRules, gradePricing } = req.body;
    const phoneModel = normalizeModelName(req.body.phoneModel);

    if (isSuperAdmin(req)) {
      // Direct Create for Super Admin
      const mobile = await Mobile.create({
        category,
        brand,
        phoneModel,
        basePrice,
        basePriceLocked,
        image,
        deductionRules,
        gradePricing
      });
      return res.status(201).json(mobile);
    } else {
      // Create Request for Admin
      const request = await MobileRequest.create({
        type: 'CREATE',
        data: { category, brand, phoneModel, basePrice, basePriceLocked, image, deductionRules, gradePricing },
        requestedBy: req.user._id
      });
      return res.status(200).json({ message: "Request submitted for approval", request });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to process mobile addition" });
  }
};

//   GET ALL MOBILES (USER)
//   only active
export const getMobiles = async (req, res) => {
  try {
    const query = req.query.includeInactive === 'true' ? {} : { isActive: true };

    // Category Filter
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category.toLowerCase();
    }

    // Brand Filter
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = { $regex: new RegExp(`^${req.query.brand}$`, 'i') };
    }

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { brand: searchRegex },
        { phoneModel: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Mobile.countDocuments(query);
    const mobiles = await Mobile.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    res.json({
      mobiles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mobiles" });
  }
};

//   GET MOBILE BY ID
export const getMobileById = async (req, res) => {
  try {
    const mobile = await Mobile.findById(req.params.id);

    if (!mobile || !mobile.isActive) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json(mobile);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mobile" });
  }
};

//   GET MOBILES BY BRAND
export const getMobilesByBrand = async (req, res) => {
  try {
    const { brand, category } = req.query;

    if (!brand) {
      return res.status(400).json({ message: "Brand is required" });
    }

    const filter = {
      brand: { $regex: new RegExp(`^${brand}$`, "i") },
      isActive: true
    };
    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    const mobiles = await Mobile.find(filter).select("phoneModel _id image");

    res.json(mobiles);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mobiles" });
  }
};

//   UPDATE MOBILE (ADMIN/SUPERADMIN)
export const updateMobile = async (req, res) => {
  try {
    const updates = {};
    const fields = ["category", "brand", "phoneModel", "basePrice", "basePriceLocked", "isActive", "image", "deductionRules", "gradePricing"];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    if (updates.phoneModel !== undefined) {
      updates.phoneModel = normalizeModelName(updates.phoneModel);
    }

    if (isSuperAdmin(req)) {
      // Direct Update
      const mobile = await Mobile.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      );

      if (!mobile) {
        return res.status(404).json({ message: "Mobile not found" });
      }
      return res.json(mobile);
    } else {
      // Request Update
      const request = await MobileRequest.create({
        type: 'UPDATE',
        mobileId: req.params.id,
        data: updates,
        requestedBy: req.user._id
      });
      return res.status(200).json({ message: "Update request submitted for approval", request });
    }
  } catch (error) {
    res.status(500).json({ message: "Mobile update failed" });
  }
};

//   DELETE MOBILE (ADMIN/SUPERADMIN)
export const deleteMobile = async (req, res) => {
  try {
    if (isSuperAdmin(req)) {
      // Direct Delete
      const mobile = await Mobile.findByIdAndDelete(req.params.id);
      if (!mobile) {
        return res.status(404).json({ message: "Mobile not found" });
      }
      return res.json({ message: "Mobile deleted successfully" });
    } else {
      // Request Delete
      const request = await MobileRequest.create({
        type: 'DELETE',
        mobileId: req.params.id,
        data: {},
        requestedBy: req.user._id
      });
      return res.status(200).json({ message: "Delete request submitted for approval", request });
    }
  } catch (error) {
    res.status(500).json({ message: "Mobile delete failed" });
  }
};

// --- REQUEST HANDLING ---

// Get Pending Requests (Super Admin)
export const getMobileRequests = async (req, res) => {
  try {
    const requests = await MobileRequest.find({ status: 'PENDING' })
      .populate('requestedBy', 'name email role')
      .populate('mobileId', 'brand phoneModel')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// Approve Request (Super Admin)
export const approveRequest = async (req, res) => {
  try {
    const request = await MobileRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: "Request already processed" });
    }

    if (request.type === 'CREATE') {
      await Mobile.create(request.data);
    } else if (request.type === 'UPDATE') {
      await Mobile.findByIdAndUpdate(request.mobileId, request.data);
    } else if (request.type === 'DELETE') {
      await Mobile.findByIdAndDelete(request.mobileId);
    }

    request.status = 'APPROVED';
    await request.save();

    res.json({ message: "Request approved and executed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve request", error: error.message, stack: error.stack });
  }
};

// Reject Request (Super Admin)
export const rejectRequest = async (req, res) => {
  try {
    const request = await MobileRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = 'REJECTED';
    request.rejectionReason = req.body.reason;
    await request.save();

    res.json({ message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject request" });
  }
};

// --- BULK GRADE-PRICE IMPORT (Super Admin / Admin) ---
//
// Expects an .xlsx/.xls/.csv where each row's first cell is "<Model Name>
// <Storage>" (e.g. "iPhone 17 Pro Max 256GB" or "i17 Pro Max 256GB" — the "i17"
// shorthand is understood too), followed by 14 numeric columns in this exact
// order: Unlocked Base, A, B, C, D, E, F (unlocked grades), Locked Base, A, B,
// C, D, E, F (locked grades) — matching the layout of the reference pricing
// sheet. A header row and any row that doesn't parse that way (section
// dividers, blank rows) are skipped, not treated as errors.
//
// Only the exact storage rows present in the sheet are touched — gradePricing
// for storages already set on a product but NOT mentioned in this upload are
// left alone (this is a merge, not a replace).
const normalizeModelWords = (s) => (s || "")
  .toLowerCase()
  .replace(/^i(\d)/, "iphone $1") // "i17 Pro Max" -> "iphone 17 Pro Max"
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .split(/\s+/)
  .filter(Boolean);

export const bulkImportGradePricing = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    } catch {
      return res.status(400).json({ message: "Couldn't read that file — is it a valid .xlsx/.xls/.csv?" });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const parsedRows = [];
    const skippedRows = [];

    rows.forEach((row, i) => {
      const cell0 = row[0];
      if (typeof cell0 !== "string") return; // blank / non-text lead cell — silently skip

      const match = cell0.trim().match(/^(.+?)\s+(\d+\s?(?:GB|TB))$/i);
      if (!match) {
        // Likely a header ("Model") or section-divider row — only worth reporting
        // if it looks like it was meant to be a data row (has other cells filled).
        if (row.slice(1).some((v) => v !== null && v !== "")) {
          skippedRows.push({ row: i + 1, reason: `Couldn't read "${cell0}" as "<Model> <Storage>"` });
        }
        return;
      }

      const [, modelNameRaw, storageRaw] = match;
      const storage = storageRaw.replace(/\s+/g, "").toUpperCase();
      const nums = row.slice(1, 15).map((v) => (v === null || v === "" ? NaN : Number(v)));
      if (nums.some((n) => Number.isNaN(n))) {
        skippedRows.push({ row: i + 1, reason: `"${cell0}" has missing/invalid price cells` });
        return;
      }

      parsedRows.push({
        rowNum: i + 1,
        modelName: modelNameRaw.trim(),
        storage,
        unlockedBase: nums[0],
        unlocked: { A: nums[1], B: nums[2], C: nums[3], D: nums[4], E: nums[5], F: nums[6] },
        lockedBase: nums[7],
        locked: { A: nums[8], B: nums[9], C: nums[10], D: nums[11], E: nums[12], F: nums[13] },
      });
    });

    if (parsedRows.length === 0) {
      return res.status(400).json({
        message: 'No usable rows found. Each row\'s first cell must read like "iPhone 17 Pro Max 256GB", followed by 14 numeric price columns (Unlocked Base, A-F, Locked Base, A-F).',
        skippedRows,
      });
    }

    const allMobiles = await Mobile.find({ category: "mobile-phones" });

    const findBestMatch = (modelName) => {
      const targetWords = normalizeModelWords(modelName);
      const candidates = allMobiles.filter((m) => {
        const nameWords = normalizeModelWords(`${m.brand} ${m.phoneModel}`);
        return targetWords.every((w) => nameWords.includes(w));
      });
      if (candidates.length === 0) return null;
      if (candidates.length === 1) return candidates[0];
      // Ambiguous (e.g. "iPhone 17" also matching "iPhone 17 Pro Max") — prefer
      // whichever candidate's own word count is closest to the target's, i.e.
      // the fewest extra/missing words.
      candidates.sort((a, b) => {
        const aDiff = Math.abs(normalizeModelWords(`${a.brand} ${a.phoneModel}`).length - targetWords.length);
        const bDiff = Math.abs(normalizeModelWords(`${b.brand} ${b.phoneModel}`).length - targetWords.length);
        return aDiff - bDiff;
      });
      return candidates[0];
    };

    // Group rows by matched product so a product with several storage rows gets
    // one update with all of them, not several separate writes.
    const updatesByMobileId = new Map();
    const notMatched = [];

    for (const row of parsedRows) {
      const mobile = findBestMatch(row.modelName);
      if (!mobile) {
        notMatched.push({ row: row.rowNum, modelName: row.modelName, storage: row.storage });
        continue;
      }
      const key = mobile._id.toString();
      if (!updatesByMobileId.has(key)) {
        updatesByMobileId.set(key, { mobile, storages: {} });
      }
      updatesByMobileId.get(key).storages[row.storage] = {
        unlockedBase: row.unlockedBase,
        lockedBase: row.lockedBase,
        unlocked: row.unlocked,
        locked: row.locked,
      };
    }

    const updated = [];
    for (const { mobile, storages } of updatesByMobileId.values()) {
      const setOps = {};
      for (const [storageKey, bucket] of Object.entries(storages)) {
        setOps[`gradePricing.${storageKey}`] = bucket;
      }
      await Mobile.findByIdAndUpdate(mobile._id, { $set: setOps });
      updated.push({
        mobileId: mobile._id,
        brand: mobile.brand,
        phoneModel: mobile.phoneModel,
        storages: Object.keys(storages),
      });
    }

    res.json({
      message: `Updated ${updated.length} product${updated.length === 1 ? "" : "s"} from ${parsedRows.length} row${parsedRows.length === 1 ? "" : "s"}.`,
      updated,
      notMatched,
      skippedRows,
    });
  } catch (error) {
    console.error("Bulk grade-price import error:", error);
    res.status(500).json({ message: "Failed to import spreadsheet", error: error.message });
  }
};
