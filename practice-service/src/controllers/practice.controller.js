const Practice    = require("../models/Practice.model");
const userService = require("../services/user.service");

const getToken = (req) => req.headers.authorization?.split(" ")[1];

// ── Create ───────────────────────────────────────────────────────
exports.createPractice = async (req, res) => {
  try {
    const { name, description, status, hrbp, manager } = req.body;

    const hrbpArray = hrbp
      ? (Array.isArray(hrbp) ? hrbp.filter(Boolean) : [hrbp])
      : [];

    const practice = await Practice.create({
      name,
      description: description || "",
      status:      status || "ACTIVE",
      hrbp:        hrbpArray,
      manager:     manager || null,
    });

    const token       = getToken(req);
    const hrbpUsers   = await userService.getUsersByIds(hrbpArray.map(String), token);
    const managerUser = manager
      ? await userService.getUserById(String(manager), token).catch(() => null)
      : null;

    res.status(201).json({ ...practice.toObject(), hrbp: hrbpUsers, manager: managerUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Get All ──────────────────────────────────────────────────────
exports.getAllPractices = async (req, res) => {
  try {
    const practices = await Practice.find();
    const token     = getToken(req);

    const result = await Promise.all(
      practices.map(async (practice) => {
        const [hrbpUsers, collaborators, managers] = await Promise.all([
          userService.getUsersByIds(practice.hrbp.map(String), token),
          userService.getUsersByPracticeAndRole(String(practice._id), "COLLABORATOR", token),
          userService.getUsersByPracticeAndRole(String(practice._id), "MANAGER", token),
        ]);
        const managerUser = practice.manager
          ? await userService.getUserById(String(practice.manager), token).catch(() => null)
          : null;

        return {
          _id:                practice._id,
          name:               practice.name,
          description:        practice.description,
          status:             practice.status,
          creationDate:       practice.creationDate,
          hrbp:               hrbpUsers,
          manager:            managerUser,
          collaborators,
          collaboratorsCount: collaborators.length,
          managers,
          managersCount:      managers.length,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get by ID ────────────────────────────────────────────────────
exports.getPracticeById = async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id);
    if (!practice) return res.status(404).json({ message: "Practice not found" });

    const token       = getToken(req);
    const hrbpUsers   = await userService.getUsersByIds(practice.hrbp.map(String), token);
    const managerUser = practice.manager
      ? await userService.getUserById(String(practice.manager), token).catch(() => null)
      : null;

    res.json({ ...practice.toObject(), hrbp: hrbpUsers, manager: managerUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update ───────────────────────────────────────────────────────
exports.updatePractice = async (req, res) => {
  try {
    const { name, description, status, hrbp, manager } = req.body;

    const updateData = {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status      !== undefined && { status }),
      ...(manager     !== undefined && { manager: manager || null }),
    };

    if (hrbp !== undefined) {
      updateData.hrbp = Array.isArray(hrbp)
        ? hrbp.filter(Boolean)
        : hrbp ? [hrbp] : [];
    }

    const practice = await Practice.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!practice) return res.status(404).json({ message: "Practice not found" });

    const token       = getToken(req);
    const hrbpUsers   = await userService.getUsersByIds(practice.hrbp.map(String), token);
    const managerUser = practice.manager
      ? await userService.getUserById(String(practice.manager), token).catch(() => null)
      : null;

    res.json({ ...practice.toObject(), hrbp: hrbpUsers, manager: managerUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Delete ───────────────────────────────────────────────────────
exports.deletePractice = async (req, res) => {
  try {
    await Practice.findByIdAndDelete(req.params.id);
    res.json({ message: "Practice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Collaborators by practice ────────────────────────────────────
exports.getCollaboratorsByPractice = async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id);
    if (!practice) return res.status(404).json({ message: "Practice not found" });

    const token         = getToken(req);
    const hrbpUsers     = await userService.getUsersByIds(practice.hrbp.map(String), token);
    const collaborators = await userService.getUsersByPracticeAndRole(
      String(practice._id), "COLLABORATOR", token, req.query.hrbpId || null
    );

    res.json({
      practiceId:         practice._id,
      practiceName:       practice.name,
      hrbpList:           hrbpUsers,
      totalCollaborators: collaborators.length,
      collaborators,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Managers by practice ─────────────────────────────────────────
exports.getManagersByPractice = async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id);
    if (!practice) return res.status(404).json({ message: "Practice not found" });

    const token     = getToken(req);
    const hrbpUsers = await userService.getUsersByIds(practice.hrbp.map(String), token);
    const managers  = await userService.getUsersByPracticeAndRole(
      String(practice._id), "MANAGER", token
    );

    res.json({
      practiceId:    practice._id,
      practiceName:  practice.name,
      hrbpList:      hrbpUsers,
      totalManagers: managers.length,
      managers:      managers.map((m) => ({ ...m, ro_id: m.ro_id ? m.ro_id.toString() : null })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Collaborators + Managers by practice AND HRBP ────────────────
exports.getCollaboratorsByPracticeAndHrbp = async (req, res) => {
  try {
    const { practiceId, hrbpId } = req.params;
    const token = getToken(req);

    const practice = await Practice.findById(practiceId);
    if (!practice) return res.status(404).json({ message: "Practice not found" });

    let hrbp;
    try { hrbp = await userService.getUserById(hrbpId, token); }
    catch { return res.status(404).json({ message: "HRBP not found" }); }
    if (hrbp.role !== "HRBP") return res.status(404).json({ message: "HRBP not found" });

    const [collaborators, managers] = await Promise.all([
      userService.getUsersByPracticeAndRole(practiceId, "COLLABORATOR", token, hrbpId),
      userService.getUsersByPracticeAndRole(practiceId, "MANAGER",      token, hrbpId),
    ]);

    res.json({
      practiceId,
      practiceName:       practice.name,
      hrbpId,
      hrbpName:           `${hrbp.first_name} ${hrbp.last_name}`,
      hrbpEmail:          hrbp.email,
      totalCollaborators: collaborators.length,
      collaborators,
      totalManagers:      managers.length,
      managers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Users by role ─────────────────────────────────────────────────
exports.getUsersByRole = async (req, res) => {
  try {
    const { role }     = req.query;
    const allowedRoles = ["HRBP", "MANAGER", "COLLABORATOR", "ADMIN_RH", "DIRECTION_RH"];
    const token        = getToken(req);

    if (!role || !allowedRoles.includes(role))
      return res.status(400).json({ message: "Rôle invalide" });

    const users = await userService.getUsersByRole(role, token);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};