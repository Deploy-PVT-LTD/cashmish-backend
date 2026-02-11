import { Mobile } from "../models/mobileModel.js";
import { MobileRequest } from "../models/mobileRequestModel.js";

// Helper to check if user is superadmin
const isSuperAdmin = (req) => req.user && req.user.role === 'superadmin';

//   ADD MOBILE (ADMIN/SUPERADMIN)
export const addMobile = async (req, res) => {
  try {
    const { brand, phoneModel, basePrice, image, deductionRules } = req.body;

    if (isSuperAdmin(req)) {
      // Direct Create for Super Admin
      const mobile = await Mobile.create({
        brand,
        phoneModel,
        basePrice,
        image,
        deductionRules
      });
      return res.status(201).json(mobile);
    } else {
      // Create Request for Admin
      const request = await MobileRequest.create({
        type: 'CREATE',
        data: { brand, phoneModel, basePrice, image, deductionRules },
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
    const { brand } = req.query;

    if (!brand) {
      return res.status(400).json({ message: "Brand is required" });
    }

    const mobiles = await Mobile.find({
      brand: { $regex: new RegExp(`^${brand}$`, "i") },
      isActive: true
    }).select("phoneModel _id image");

    res.json(mobiles);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mobiles" });
  }
};

//   UPDATE MOBILE (ADMIN/SUPERADMIN)
export const updateMobile = async (req, res) => {
  try {
    const updates = {};
    const fields = ["brand", "phoneModel", "basePrice", "isActive", "image", "deductionRules"];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

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
    res.status(500).json({ message: "Failed to approve request" });
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
