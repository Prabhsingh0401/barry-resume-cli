#!/usr/bin/env node

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import { intro, outro, text, spinner, isCancel, cancel } from '@clack/prompts';
import { Groq } from 'groq-sdk';

const execAsync = promisify(exec);

// ── LaTeX Escape ──────────────────────────────────────────────────────────────
function texEscape(textStr) {
    if (textStr === undefined || textStr === null) return "";
    let t = String(textStr);
    const replacements = [
        ["\\", "\\textbackslash{}"],
        ["&", "\\&"],
        ["%", "\\%"],
        ["$", "\\$"],
        ["#", "\\#"],
        ["_", "\\_"],
        ["{", "\\{"],
        ["}", "\\}"],
        ["~", "\\textasciitilde{}"],
        ["^", "\\textasciicircum{}"],
    ];
    for (const [char, escaped] of replacements) {
        t = t.split(char).join(escaped);
    }
    return t;
}

// ── ATS Rules injected into LLM system prompt ────────────────────────────────
const ATS_SYSTEM_PROMPT = `You are a senior technical resume specialist and ATS optimisation expert.

YOUR CORE JOB:
Given a candidate's base resume JSON and a job description (JD), you rewrite
the resume content to maximise ATS score and recruiter relevance.

STRICT RULES — violating any of these is a failure:
1. NEVER fabricate experience, skills, tools, companies, or metrics that are not
   already present in the base resume. You may only REFRAME, REORDER, or
   REPHRASE what exists.
2. KEYWORD ALIGNMENT — extract the top 15-20 keywords/phrases from the JD
   (skills, tools, exact job title, methodologies). Weave them naturally into
   the summary, bullets, and skills list. Do NOT keyword-stuff.
3. EXACT JOB TITLE — include the exact job title from the JD (or a very close
   match) in the Professional Summary line.
4. ACTION VERBS — start every bullet with a strong past-tense action verb
   (Architected, Engineered, Delivered, Led, Optimised, Developed, Automated…).
5. QUANTIFY — preserve all existing numbers. Where a bullet lacks a metric and
   one can be reasonably inferred from context (e.g., team size, time saved),
   add it. Never invent metrics not implied by the original.
6. SKILLS REORDERING — put the skills most relevant to the JD first in each
   category. Remove skills clearly irrelevant to the role (but keep the JSON
   structure).
7. BULLET LENGTH — each bullet: 1-2 lines, 15-25 words. Tight, impactful.
8. SUMMARY — 2-4 sentences max. First sentence must mirror the JD's target role.
9. SECTION ORDER — do not reorder sections. Keep all sections present.
10. OUTPUT — return ONLY valid JSON matching the exact schema of the input
    resume JSON. No markdown, no backticks, no explanation. Pure JSON.

JD ANALYSIS STEPS (internal — do not include in output):
- Identify the exact role title
- Extract hard skills (languages, frameworks, tools, platforms)
- Extract soft skills / methodologies (Agile, leadership, communication)
- Note any specific domain keywords (fintech, B2B SaaS, ML, etc.)
- Identify what they value most (look at requirements order)
Then incorporate findings into the rewritten JSON.`;

// ── Groq API Call ─────────────────────────────────────────────────────────────
async function callGroq(baseResume, jdText, company) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY environment variable not set.");
    }
    const groq = new Groq({ apiKey });
    
    const userMessage = `COMPANY: ${company}

JOB DESCRIPTION:
${jdText}

BASE RESUME JSON:
${JSON.stringify(baseResume, null, 2)}

Rewrite the resume for this specific JD following all rules in your system prompt.
Return ONLY the updated JSON — no markdown fences, no prose.`;

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: ATS_SYSTEM_PROMPT },
            { role: "user", content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 4096,
    });

    let raw = response.choices[0].message.content.trim();
    raw = raw.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    return JSON.parse(raw);
}

// ── Build LaTeX Blocks ────────────────────────────────────────────────────────
function buildSkillsItems(skills) {
    if (!skills) return "";
    return skills.map(skillGroup => {
        const cat = texEscape(skillGroup.category);
        const items = skillGroup.items.map(texEscape).join(", ");
        return `     \\textbf{${cat}:} ${items} \\\\[2pt]`;
    }).join("\n");
}

function buildExperienceBlock(experience) {
    if (!experience) return "";
    return experience.map(job => {
        const title = texEscape(job.role);
        const comp = texEscape(job.company);
        const loc = texEscape(job.location);
        const duration = texEscape(job.duration);
        const bullets = job.details.map(b => `\\resumeItem{${texEscape(b)}}`).join("\n        ");
        return `    \\resumeSubheading\n      {${title}}{${duration}}\n      {${comp}}{${loc}}\n      \\resumeItemListStart\n        ${bullets}\n      \\resumeItemListEnd`;
    }).join("\n\n");
}

function buildProjectsBlock(projects) {
    if (!projects) return "";
    return projects.map(proj => {
        const name = texEscape(proj.name);
        const tech = texEscape(proj.technologies.join(", "));
        const link = proj.link;
        let headingParts = [`\\textbf{${name}}`, `\\emph{${tech}}`];
        if (link) headingParts.push(`\\href{${link}}{\\underline{Link}}`);
        const headingStr = headingParts.join(" $|$ ");
        const bullets = proj.details.map(b => `\\resumeItem{${texEscape(b)}}`).join("\n            ");
        return `      \\resumeProjectHeading\n          {${headingStr}}{}\n          \\resumeItemListStart\n            ${bullets}\n          \\resumeItemListEnd`;
    }).join("\n\n");
}

function buildEducationBlock(education) {
    if (!education) return "";
    return education.map(edu => {
        const inst = texEscape(edu.institution);
        const deg = texEscape(edu.degree);
        const dur = texEscape(edu.duration);
        return `    \\resumeSubheading\n      {${inst}}{}\n      {${deg}}{${dur}}`;
    }).join("\n\n");
}

function buildAchievementsBlock(achievements) {
    if (!achievements) return "";
    return achievements.map(ach => {
        const title = texEscape(ach.title);
        let desc = texEscape(ach.description);
        if (desc.startsWith("Received from")) {
            desc = desc.replace("Received from ", "from ");
            return `    \\resumeSubItem{Received \\textbf{${title}} ${desc}}`;
        } else {
            return `    \\resumeSubItem{\\textbf{${title}:} ${desc}}`;
        }
    }).join("\n");
}

function buildPorBlock(pors) {
    if (!pors) return "";
    return pors.map(por => {
        const role = texEscape(por.role);
        const org = texEscape(por.organization);
        const loc = texEscape(por.location);
        const dur = texEscape(por.duration);
        const bullets = por.details.map(b => `\\resumeItem{${texEscape(b)}}`).join("\n        ");
        return `    \\resumeSubheading\n      {${role}}{${dur}}\n      {${org}}{${loc}}\n      \\resumeItemListStart\n        ${bullets}\n      \\resumeItemListEnd`;
    }).join("\n\n");
}

function fillTemplate(template, data) {
    const p = data.basics || {};
    const replacements = {
        "{{NAME}}": texEscape(p.name || ""),
        "{{PHONE}}": texEscape(p.phone || ""),
        "{{EMAIL}}": p.email || "",
        "{{LINKEDIN_URL}}": p.linkedin || "",
        "{{GITHUB_URL}}": p.github || "",
        "{{PORTFOLIO_URL}}": p.website || "",
        "{{MEDIUM_URL}}": p.medium || "",
        "{{SKILLS_ITEMS}}": buildSkillsItems(data.skills),
        "{{EXPERIENCE_BLOCK}}": buildExperienceBlock(data.workExperience),
        "{{PROJECTS_BLOCK}}": buildProjectsBlock(data.projects),
        "{{EDUCATION_BLOCK}}": buildEducationBlock(data.education),
        "{{ACHIEVEMENTS_BLOCK}}": buildAchievementsBlock(data.achievements),
        "{{POR_BLOCK}}": buildPorBlock(data.positionsOfResponsibility)
    };

    let filled = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
        filled = filled.split(placeholder).join(value);
    }
    return filled;
}

// ── Main CLI Flow ─────────────────────────────────────────────────────────────
async function main() {
    console.clear();
    const titleText = figlet.textSync('BARRY', { font: 'Slant' });
    console.log(
        boxen(chalk.blueBright(titleText) + '\n\n' + chalk.cyan('AI ATS-Optimised Resume Builder'), {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'blueBright',
            title: 'v1.0.0',
            titleAlignment: 'center'
        })
    );

    intro(chalk.bgBlue.black(' Welcome to Barry CLI '));

    // Check prerequisites
    const checkSpin = spinner();
    checkSpin.start('Checking system requirements...');
    try {
        await execAsync('pdflatex -version');
        checkSpin.stop(chalk.green('✔ pdflatex found'));
    } catch (e) {
        checkSpin.stop(chalk.red('✖ pdflatex not found!'));
        console.log(chalk.yellow('Please install LaTeX (MiKTeX/TeX Live) to generate PDFs.'));
        process.exit(1);
    }

    if (!process.env.GROQ_API_KEY) {
        console.log(chalk.red('\n✖ GROQ_API_KEY environment variable is missing.'));
        process.exit(1);
    }

    // Prompts
    const resumeDataPath = await text({
        message: 'Where is your resume JSON data?',
        initialValue: 'resume_data.json',
        validate(value) {
            if (!fs.existsSync(value)) return `File not found: ${value}`;
        }
    });
    if (isCancel(resumeDataPath)) { cancel('Operation cancelled'); process.exit(0); }

    const resumeTemplatePath = await text({
        message: 'Where is your LaTeX template?',
        initialValue: 'resume_template.tex',
        validate(value) {
            if (!fs.existsSync(value)) return `File not found: ${value}`;
        }
    });
    if (isCancel(resumeTemplatePath)) { cancel('Operation cancelled'); process.exit(0); }

    const jdPath = await text({
        message: 'Where is the Job Description (.txt)?',
        validate(value) {
            if (!fs.existsSync(value)) return `File not found: ${value}`;
        }
    });
    if (isCancel(jdPath)) { cancel('Operation cancelled'); process.exit(0); }

    const companyName = await text({
        message: 'What is the Company Name?',
        validate(value) {
            if (value.trim().length === 0) return 'Company name is required';
        }
    });
    if (isCancel(companyName)) { cancel('Operation cancelled'); process.exit(0); }

    const outputDir = await text({
        message: 'Where should we save the generated resume?',
        initialValue: 'output'
    });
    if (isCancel(outputDir)) { cancel('Operation cancelled'); process.exit(0); }

    // Read files
    const s = spinner();
    s.start('Reading input files...');
    let baseResume, template, jdText;
    
    try {
        const rawJson = await fsp.readFile(resumeDataPath, 'utf-8');
        try {
            baseResume = JSON.parse(rawJson);
        } catch (jsonErr) {
            s.stop(chalk.red('✖ Invalid JSON format'));
            console.log(chalk.yellow(`Could not parse ${resumeDataPath}. Please ensure it is valid JSON.`));
            process.exit(1);
        }
        
        template = await fsp.readFile(resumeTemplatePath, 'utf-8');
        jdText = await fsp.readFile(jdPath, 'utf-8');
        s.stop(chalk.green('✔ Files loaded'));
    } catch (e) {
        s.stop(chalk.red('✖ Failed to read files'));
        console.log(chalk.yellow('Ensure all paths are correct and files are readable.'));
        console.error(e.message);
        process.exit(1);
    }

    // LLM
    s.start('Tailoring resume with Groq AI...');
    let tailoredResume;
    try {
        tailoredResume = await callGroq(baseResume, jdText, companyName);
        s.stop(chalk.green('✔ Resume tailored successfully'));
    } catch (e) {
        s.stop(chalk.red('✖ AI tailoring failed'));
        console.error(e);
        process.exit(1);
    }

    // Prepare Output
    s.start('Generating PDF with LaTeX...');
    try {
        if (!fs.existsSync(outputDir)) {
            await fsp.mkdir(outputDir, { recursive: true });
        }
        
        const companySlug = companyName.replace(/[^A-Za-z0-9_-]/g, '_');
        const jsonName = `tailored_${companySlug}.json`;
        await fsp.writeFile(path.join(outputDir, jsonName), JSON.stringify(tailoredResume, null, 2), 'utf-8');

        const filledTex = fillTemplate(template, tailoredResume);
        const texName = `prableen_resume_${companySlug}.tex`;
        const texPath = path.join(outputDir, texName);
        await fsp.writeFile(texPath, filledTex, 'utf-8');

        // Compile
        const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'barry-'));
        const tmpTex = path.join(tmpDir, 'resume.tex');
        await fsp.writeFile(tmpTex, filledTex, 'utf-8');

        for (let i = 0; i < 2; i++) {
            await execAsync(`pdflatex -interaction=nonstopmode "${tmpTex}"`, { cwd: tmpDir });
        }

        const compiledPdf = path.join(tmpDir, 'resume.pdf');
        const pdfOutPath = path.join(outputDir, `prableen_resume_${companySlug}.pdf`);
        await fsp.copyFile(compiledPdf, pdfOutPath);

        s.stop(chalk.green('✔ PDF compiled successfully'));
        
        outro(chalk.cyanBright(`🎉 Done! Your resume is ready at: `) + chalk.underline.bold(pdfOutPath));
    } catch (e) {
        s.stop(chalk.red('✖ PDF generation failed'));
        console.error(e.stdout || e);
        process.exit(1);
    }
}

main().catch(console.error);
