/**
 * BADGE SYSTEM — Définitions des badges.
 * Les seuils sont progressifs et plus exigeants.
 * Badges automatiquement attribués quand surveysAnswered atteint un seuil.
 * Stockés dans la collection Badge (DB) — plus dans User.gamification.
 */

const BADGE_DEFINITIONS = [
  {
    id: "PREMIER_PAS",
    name: "Premier Pas",
    description: "Tu as répondu à ton premier sondage. Bienvenue dans l'aventure !",
    icon: "🌱",
    color: "#66BB6A",
    gradient: ["#81C784", "#388E3C"],
    surveysRequired: 1,
  },
  {
    id: "CURIEUX",
    name: "Curieux",
    description: "3 sondages complétés. Tu commences à t'impliquer !",
    icon: "🔍",
    color: "#29B6F6",
    gradient: ["#4FC3F7", "#0277BD"],
    surveysRequired: 3,
  },
  {
    id: "DEBUTANT",
    name: "Débutant",
    description: "6 sondages. Tu prends de vraiment bonnes habitudes !",
    icon: "⭐",
    color: "#FFA726",
    gradient: ["#FFB74D", "#E65100"],
    surveysRequired: 6,
  },
  {
    id: "ASSIDU",
    name: "Assidu",
    description: "10 sondages. Ta régularité est remarquable.",
    icon: "📋",
    color: "#26C6DA",
    gradient: ["#4DD0E1", "#00838F"],
    surveysRequired: 10,
  },
  {
    id: "REGULIER",
    name: "Régulier",
    description: "15 sondages. Tu es un contributeur fiable de l'équipe !",
    icon: "🔥",
    color: "#EF5350",
    gradient: ["#FF7043", "#B71C1C"],
    surveysRequired: 15,
  },
  {
    id: "ENGAGE",
    name: "Engagé",
    description: "20 sondages. Ton engagement fait vraiment la différence !",
    icon: "💎",
    color: "#42A5F5",
    gradient: ["#64B5F6", "#1565C0"],
    surveysRequired: 20,
  },
  {
    id: "PASSIONNÉ",
    name: "Passionné",
    description: "30 sondages. La voix de l'équipe, c'est toi !",
    icon: "🚀",
    color: "#EC407A",
    gradient: ["#F48FB1", "#880E4F"],
    surveysRequired: 30,
  },
  {
    id: "EXPERT",
    name: "Expert",
    description: "40 sondages. Tu es un pilier incontournable de la communauté.",
    icon: "🏆",
    color: "#FFD700",
    gradient: ["#FFEE58", "#F9A825"],
    surveysRequired: 40,
  },
  {
    id: "VETERAN",
    name: "Vétéran",
    description: "60 sondages. Une expérience hors pair, reconnue de tous.",
    icon: "🛡️",
    color: "#8D6E63",
    gradient: ["#A1887F", "#4E342E"],
    surveysRequired: 60,
  },
  {
    id: "ELITE",
    name: "Élite",
    description: "80 sondages. Tu fais partie du cercle très restreint des élites.",
    icon: "⚡",
    color: "#7E57C2",
    gradient: ["#9575CD", "#311B92"],
    surveysRequired: 80,
  },
  {
    id: "LEGENDE",
    name: "Légende",
    description: "100 sondages. Une véritable légende vivante de l'entreprise !",
    icon: "👑",
    color: "#AB47BC",
    gradient: ["#CE93D8", "#6A1B9A"],
    surveysRequired: 100,
  },
];

/**
 * Retourne les badges nouvellement gagnés après réponse à un sondage.
 * @param {number} newCount - total surveysAnswered APRÈS ce sondage
 * @param {string[]} alreadyEarnedIds - badgeIds déjà possédés
 */
const getNewlyEarnedBadges = (newCount, alreadyEarnedIds = []) => {
  return BADGE_DEFINITIONS.filter(
    (b) => newCount >= b.surveysRequired && !alreadyEarnedIds.includes(b.id)
  );
};

/**
 * Retourne le prochain badge non encore gagné.
 */
const getNextBadge = (surveysAnswered) => {
  return BADGE_DEFINITIONS.find((b) => b.surveysRequired > surveysAnswered) || null;
};

module.exports = { BADGE_DEFINITIONS, getNewlyEarnedBadges, getNextBadge };
