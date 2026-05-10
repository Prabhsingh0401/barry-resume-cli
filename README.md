# ⚡ Barry

<img width="1920" height="645" alt="Untitled design (24)" src="https://github.com/user-attachments/assets/1ff28bb0-26d5-45c2-b430-9d12452ad742" />


Introducing Barry, an ATS-optimised resume generator CLI. Barry takes your base resume JSON, a LaTeX template, and a Job Description, then leverages the Groq LLM API to rewrite your resume specifically for that role and compiles it into a beautiful PDF locally.

## 🚀 Installation

Install Barry globally on your machine using npm:

```bash
npm install -g barry-resume-cli
```

### Prerequisites
1. **Node.js** (v18+)
2. **pdflatex**: You must have LaTeX installed on your system to generate PDFs.
   - **Windows**: Install [MiKTeX](https://miktex.org/download) or TeX Live.
   - **macOS**: Install [MacTeX](https://tug.org/mactex/).
   - **Linux**: `sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-extra-utils texlive-latex-extra`

## ⚙️ Configuration

Barry uses Groq's high-speed LLM to tailor your resume. You'll need a free API key from [Groq](https://console.groq.com).

Set it as an environment variable in your terminal:

**Mac/Linux:**
```bash
export GROQ_API_KEY="your-api-key-here"
```

**Windows (PowerShell):**
```powershell
$env:GROQ_API_KEY="your-api-key-here"
```

## 🛠️ Usage

To use Barry, you should create a specific folder for your job application and place your files there. This ensures a smooth and clean experience.

**Step 1: Prepare your files**
Create a new folder and add the following files to it:
1. `resume_data.json` (Your base resume data in JSON format)
2. `resume_template.tex` (Your LaTeX design template)
3. `jd.txt` (The Job Description you are applying for, saved as plain text)

*(Need examples? Check the `examples/` directory in this repository to see exactly how your input files should be structured!)*

**Step 2: Run the CLI**
Open your terminal inside the folder where you placed those files, and simply run:

```bash
barry
```

**Step 3: Follow the Prompts**
Barry will launch an interactive UI and guide you to confirm your file paths and enter the Company Name. It will then securely generate a tailored JSON, compile it via LaTeX, and output your ATS-ready PDF directly into an `output/` folder!

## 📄 File Formats

### `resume_data.json`

The JSON structure Barry expects:

```json
{
  "basics": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "+1 555-123-4567",
    "linkedin": "https://linkedin.com/in/janedoe",
    "github": "https://github.com/janedoe",
    "website": "https://janedoe.com",
    "medium": "https://medium.com/@janedoe"
  },
  "skills": [
    { "category": "Languages", "items": ["Python", "JavaScript"] },
    { "category": "Frameworks", "items": ["React", "Node.js"] }
  ],
  "workExperience": [
    {
      "company": "Tech Corp",
      "role": "Software Engineer",
      "location": "San Francisco, CA",
      "duration": "June 2021 - Present",
      "details": [
        "Engineered scalable microservices using Node.js and Express.",
        "Reduced query latency by 30% through query optimisation."
      ]
    }
  ],
  "projects": [
    {
      "name": "Portfolio App",
      "technologies": ["React", "Tailwind CSS"],
      "link": "https://github.com/janedoe/portfolio",
      "details": [
        "Built a responsive portfolio app with modern frontend frameworks.",
        "Set up CI/CD via GitHub Actions for automated deployment."
      ]
    }
  ],
  "education": [
    {
      "institution": "State University",
      "degree": "B.S. in Computer Science",
      "duration": "Aug 2017 - May 2021"
    }
  ],
  "achievements": [
    {
      "title": "Hackathon Winner",
      "description": "First place in the 2020 Global Hackathon."
    }
  ],
  "positionsOfResponsibility": [
    {
      "role": "Club President",
      "organization": "CS Club",
      "location": "State University",
      "duration": "Jan 2020 - May 2021",
      "details": [
        "Organised workshops and hackathons for 200+ students."
      ]
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `basics` | object | yes | Name, contact, and social links |
| `skills` | array | yes | Array of `{ category, items }` objects |
| `workExperience` | array | yes | Array of `{ company, role, location, duration, details }` |
| `projects` | array | yes | Array of `{ name, technologies, link?, details }` |
| `education` | array | yes | Array of `{ institution, degree, duration }` |
| `achievements` | array | yes | Array of `{ title, description }` |
| `positionsOfResponsibility` | array | yes | Same structure as work experience |

### `resume_template.tex`

A standard LaTeX resume template using these custom commands:

| Command | Usage |
|---------|-------|
| `\resumeItem{text}` | A single bullet point |
| `\resumeSubheading{title}{duration}{company}{location}` | Experience/education entry header |
| `\resumeProjectHeading{title}{}` | Project entry header |
| `\resumeSubItem{text}` | Compact single-line item |
| `\resumeSubHeadingListStart/End` | Wrapper for subheading blocks |
| `\resumeItemListStart/End` | Wrapper for bullet lists |

Barry replaces these placeholders in your template:

| Placeholder | Source |
|-------------|--------|
| `{{NAME}}`, `{{PHONE}}`, `{{EMAIL}}` | `basics` |
| `{{LINKEDIN_URL}}`, `{{GITHUB_URL}}` | `basics` |
| `{{PORTFOLIO_URL}}`, `{{MEDIUM_URL}}` | `basics` |
| `{{SKILLS_ITEMS}}` | `skills` (auto-generated) |
| `{{EXPERIENCE_BLOCK}}` | `workExperience` (auto-generated) |
| `{{PROJECTS_BLOCK}}` | `projects` (auto-generated) |
| `{{EDUCATION_BLOCK}}` | `education` (auto-generated) |
| `{{ACHIEVEMENTS_BLOCK}}` | `achievements` (auto-generated) |
| `{{POR_BLOCK}}` | `positionsOfResponsibility` (auto-generated) |

You can customise the styling (fonts, margins, section order) as long as you keep the `{{PLACEHOLDERS}}` intact. See `examples/resume_template.tex` for a complete reference.

## 🤝 Contributing
Contributions, issues and feature requests are always welcome!
