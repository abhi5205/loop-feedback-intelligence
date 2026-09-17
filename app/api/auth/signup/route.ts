import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name, workspaceName } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Generate unique slug for workspace
    const baseSlug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let slug = baseSlug || "workspace";
    
    // Check if slug exists, append random suffix if needed
    const existingWs = await prisma.workspace.findUnique({ where: { slug } });
    if (existingWs) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Atomically create workspace and initial ADMIN user
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName.trim(),
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          name: name.trim(),
          passwordHash,
          role: Role.ADMIN,
          workspaceId: workspace.id,
        },
      });

      // Also create default starter themes for the new workspace
      await tx.theme.createMany({
        data: [
          { workspaceId: workspace.id, name: "Performance & Latency", color: "#ef4444" },
          { workspaceId: workspace.id, name: "UI & Usability", color: "#6366f1" },
          { workspaceId: workspace.id, name: "Billing & Pricing", color: "#f59e0b" },
          { workspaceId: workspace.id, name: "Onboarding & Docs", color: "#10b981" },
        ],
      });

      return { user, workspace };
    });

    return NextResponse.json(
      {
        message: "Workspace and Admin account created successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          workspaceId: result.workspace.id,
          workspaceName: result.workspace.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account", details: error.message },
      { status: 500 }
    );
  }
}
