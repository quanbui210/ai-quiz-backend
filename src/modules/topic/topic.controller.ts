import { Request, Response } from "express";
import OpenAI from "openai";
import { Topic, Prisma } from "@prisma/client";
import prisma from "../../utils/prisma";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export const validateTopic = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "name is required and must be a non-empty string" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
          You are a topic validation assistant. Your task is to validate if the topic is valid and suitable for quiz questions and study materials.
          
          Return true if the topic is valid and suitable for quiz questions and study materials, otherwise return false and provide a reason why the topic is not valid. also provide a suggestion for a valid topic.

          for example:
          if the topic is coding, return false but suggest a more specific topic like "JavaScript Async/Await" or "Python".
          if the topic is ASDFSADFSD or non-sense words or characters, return false and provide a suggestion for a valid topic. 
          if the topic is too general, return false and provide a suggestion for a more specific topic.
          if the topic is not suitable for quiz questions and study materials, return false and provide a suggestion for a valid topic.
          For any topic that only has 1 simple word like code, exam, drive, test, etc... return false and provide a suggestion for a more specific topic.
          For any topic that is not a topic, return false and provide a suggestion for a valid topic.
          
          `,
        },
        {
          role: "user",
          content: `Validate the topic: "${name}"`,
        },
      ],
    });

    const topicContent = response.choices[0]?.message?.content;
    if (!topicContent) {
      return res.status(400).json({ error: "No topic suggested" });
    }

    const isValid = topicContent.includes("true");
    if (!isValid) {
      return res.status(400).json({ error: topicContent });
    }

    return res.json({ isValid, suggestion: topicContent });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "Failed to validate topic" });
  }
};



export const suggestTopic = async (req: Request, res: Response) => {
  try {
    const { userTopic } = req.body;

    if (
      !userTopic ||
      typeof userTopic !== "string" ||
      userTopic.trim().length === 0
    ) {
      return res.status(400).json({
        error: "userTopic is required and must be a non-empty string",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "OpenAI API key is not configured" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
            You are a quiz topic suggestion assistant. Your task is to suggest 3 specific quiz topics 
            that are suitable for creating practice quizzes and study materials.
            
            Focus on topics that:
            - Are good for quiz questions and practice tests
            - Cover specific concepts, rules, or knowledge areas to study
            - Are suitable for theory practice and self-assessment
            - Help users practice and test their understanding
            
            Examples:
            - Input: "driving license" → Output: "Traffic Signs and Signals", "Road Rules and Regulations", "Vehicle Safety and Maintenance"
            - Input: "math" → Output: "Algebra Basics", "Geometry Fundamentals", "Calculus Derivatives"
            - Input: "history" → Output: "World War II Events", "Ancient Civilizations", "Renaissance Period"
            
            Return ONLY the 3 topic names, one per line, without numbering, bullets, or explanations.
            Make them concise, specific, and quiz-friendly.
          `,
        },
        {
          role: "user",
          content: `Suggest 3 quiz topics for practice and study related to: "${userTopic.trim()}"`,
        },
      ],
    });

    const topicContent = response.choices[0]?.message?.content;
    if (!topicContent) {
      return res.status(400).json({ error: "No topic suggested" });
    }

    const topics = topicContent
      .split("\n")
      .map((line) => {
        let cleaned = line.replace(/^\d+\.\s*/, "");
        cleaned = cleaned.replace(/^[-*•]\s*/, "");
        return cleaned.trim();
      })
      .filter((topic) => topic.length > 0)
      .slice(0, 3);

    if (topics.length === 0) {
      return res.status(400).json({ error: "No valid topics" });
    }
    return res.json({ topics });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "Failed to suggest topics" });
  }
};

export const createTopic = async (req: Request, res: Response) => {
  try {
    const { name, userId } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "name is required and must be a non-empty string" });
    }
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId is required" });
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        userId,
      },
    });

    return res.json(topic);
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "Failed to create topic" });
  }
};
