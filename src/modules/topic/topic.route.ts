import { Router } from "express";
import { createTopic, suggestTopic, validateTopic } from "./topic.controller";

const router = Router();

/**
 * @route   POST /api/topic/suggest
 * @desc    Suggest topics based on user input
 * @access  Private
 */
router.post("/suggest", suggestTopic);

/**
 * @route   POST /api/topic/validate
 * @desc    Validate a topic
 * @access  Private
 */
router.post("/validate", validateTopic);

/**
 * @route   POST /api/topic/create
 * @desc    Create a topic
 * @access  Private
 */
router.post("/create", createTopic);

export default router;
