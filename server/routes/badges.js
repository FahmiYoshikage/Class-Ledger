import express from 'express';
import badgeService, { BADGE_DEFINITIONS } from '../services/badgeService.js';
import Badge from '../models/Badge.js';

const router = express.Router();

// Get all badge definitions
router.get('/definitions', (req, res) => {
    res.json(BADGE_DEFINITIONS);
});

// Get badges for a specific student
router.get('/student/:studentId', async (req, res) => {
    try {
        const badges = await badgeService.getStudentBadges(
            req.params.studentId
        );
        res.json(badges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calculate badges for a specific student
router.post('/calculate/:studentId', async (req, res) => {
    try {
        const badges = await badgeService.calculateBadgesForStudent(
            req.params.studentId
        );
        res.json({
            success: true,
            badges,
            count: badges.length,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calculate badges for all students
router.post('/calculate-all', async (req, res) => {
    try {
        const result = await badgeService.calculateAllBadges();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get leaderboard with badges
router.get('/leaderboard-with-badges', async (req, res) => {
    try {
        const badges = await Badge.find()
            .populate('studentId', 'name nickname absen')
            .sort({ earnedAt: -1 });

        // Group by student
        const studentBadges = {};
        badges.forEach((badge) => {
            const studentId = badge.studentId._id.toString();
            if (!studentBadges[studentId]) {
                studentBadges[studentId] = {
                    student: badge.studentId,
                    badges: [],
                };
            }
            studentBadges[studentId].badges.push({
                type: badge.badgeType,
                ...BADGE_DEFINITIONS[badge.badgeType],
                earnedAt: badge.earnedAt,
            });
        });

        // Convert to array and sort by badge count
        const leaderboard = Object.values(studentBadges).sort(
            (a, b) => b.badges.length - a.badges.length
        );

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
