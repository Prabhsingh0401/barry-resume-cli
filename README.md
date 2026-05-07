# ⚡ Barry

<img width="376" height="219" alt="image" src="https://github.com/user-attachments/assets/571fc71b-21cc-4632-8820-fefb4a457895" />

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

## 🤝 Contributing
Contributions, issues and feature requests are always welcome!
