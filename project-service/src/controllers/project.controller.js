const Project          = require("../models/Project.model");
const practiceService  = require("../services/practice.service");
const userService      = require("../services/user.service");

// ─── Helper : résout le manager (ObjectId → objet user) via user-service ───
const resolveManager = async (project, token) => {
  if (!project.manager) return project.toObject();

  try {
    const user = await userService.getUserById(project.manager.toString(), token);
    const obj  = project.toObject();
    obj.manager = {
      _id:        user._id,
      first_name: user.first_name,
      last_name:  user.last_name,
      email:      user.email,
    };
    return obj;
  } catch {
    // Si le user-service est injoignable, on renvoie l'ID brut
    return project.toObject();
  }
};

// ─── Helper : résout plusieurs managers en parallèle ──────────────────────
const resolveManagers = async (projects, token) => {
  return Promise.all(projects.map((p) => resolveManager(p, token)));
};

// ─── GET /api/practices/:practiceId/projects ──────────────────────────────
exports.getProjectsByPractice = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const token = req.headers.authorization;

    // Vérifie l'existence de la practice
    const practice = await practiceService.getPracticeById(practiceId, token.split(" ")[1]);
    if (!practice) {
      return res.status(404).json({ message: "Practice not found" });
    }

    const projects = await Project.find({ practice_id: practiceId }).sort({ creationDate: -1 });

    const populated = await resolveManagers(projects, token.split(" ")[1]);

    res.status(200).json(populated);
  } catch (err) {
    console.error("[project-service] getProjectsByPractice error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GET /api/practices/:practiceId/projects/:id ─────────────────────────
exports.getProjectById = async (req, res) => {
  try {
    const { practiceId, id } = req.params;
    const token = req.headers.authorization.split(" ")[1];

    const project = await Project.findOne({ _id: id, practice_id: practiceId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const populated = await resolveManager(project, token);
    res.status(200).json(populated);
  } catch (err) {
    console.error("[project-service] getProjectById error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── POST /api/practices/:practiceId/projects ─────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const token = req.headers.authorization.split(" ")[1];

    // Vérifie l'existence de la practice
    const practice = await practiceService.getPracticeById(practiceId, token);
    if (!practice) {
      return res.status(404).json({ message: "Practice not found" });
    }

    const { name, description, status, manager, startDate, endDate } = req.body;

    const project = new Project({
      name,
      description,
      status,
      manager:     manager   || null,
      startDate:   startDate || null,
      endDate:     endDate   || null,
      practice_id: practiceId,
    });

    await project.save();

    const populated = await resolveManager(project, token);
    res.status(201).json(populated);
  } catch (err) {
    console.error("[project-service] createProject error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PUT /api/practices/:practiceId/projects/:id ──────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const { practiceId, id } = req.params;
    const token = req.headers.authorization.split(" ")[1];

    const { name, description, status, manager, startDate, endDate } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: id, practice_id: practiceId },
      {
        name,
        description,
        status,
        manager:   manager   || null,
        startDate: startDate || null,
        endDate:   endDate   || null,
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const populated = await resolveManager(project, token);
    res.status(200).json(populated);
  } catch (err) {
    console.error("[project-service] updateProject error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── DELETE /api/practices/:practiceId/projects/:id ───────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const { practiceId, id } = req.params;

    const project = await Project.findOneAndDelete({ _id: id, practice_id: practiceId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("[project-service] deleteProject error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GET /api/practices/:practiceId/projects/:id/managers ─────────────────
// Liste les managers disponibles pour une practice donnée
exports.getManagersByPractice = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const token = req.headers.authorization.split(" ")[1];

    const managers = await userService.getUsersByPracticeAndRole(practiceId, "MANAGER", token);
    res.status(200).json(managers);
  } catch (err) {
    console.error("[project-service] getManagersByPractice error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
