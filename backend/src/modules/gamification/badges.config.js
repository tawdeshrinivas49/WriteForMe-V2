const BADGES = {
  FIRST_PEN: {
    id: 'FIRST_PEN',
    title: 'First Pen',
    description: 'Successfully completed your first scribe assignment.',
    icon: '✒️',
    condition: (stats) => stats.totalExams >= 1
  },
  STAR_SCRIBE: {
    id: 'STAR_SCRIBE',
    title: 'Star Scribe',
    description: 'Maintained a 4.8+ average rating across at least 3 exams.',
    icon: '⭐',
    condition: (stats) => stats.totalExams >= 3 && stats.averageRating >= 4.8
  },
  EMERGENCY_HERO: {
    id: 'EMERGENCY_HERO',
    title: 'Emergency Hero',
    description: 'Accepted an urgent scribe request with less than 24 hours notice.',
    icon: '🚨',
    condition: (stats, event) => event?.isEmergency === true
  },
  VETERAN_10: {
    id: 'VETERAN_10',
    title: 'Veteran Scribe',
    description: 'Completed 10 scribe assignments.',
    icon: '🏅',
    condition: (stats) => stats.totalExams >= 10
  },
  MILESTONE_25: {
    id: 'MILESTONE_25',
    title: 'Master Scribe 25',
    description: 'Completed 25 scribe assignments.',
    icon: '👑',
    condition: (stats) => stats.totalExams >= 25
  }
};

module.exports = BADGES;