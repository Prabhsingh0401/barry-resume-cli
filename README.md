# ⚡ Barry

An AI-powered, ATS-optimised resume generator CLI. Barry takes your base resume JSON, a LaTeX template, and a Job Description, then leverages the Groq LLM API to rewrite your resume specifically for that role and compiles it into a beautiful PDF locally.

## 🚀 Installation

Install Barry globally on your machine using npm:

```bash
npm install -g barry
```

*(Note: Ensure you are installing the correct package. If `barry` is already taken on npm, update this command based on the published name!)*

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

Once installed and configured, open your terminal in the folder containing your resume files and run:

```bash
barry
```

Barry will launch an interactive UI and guide you to select:
1. Your **Base Resume JSON** (e.g., `resume_data.json`)
2. Your **LaTeX Template** (e.g., `resume_template.tex`)
3. The **Job Description** text file (e.g., `jd.txt`)
4. The **Company Name** (for output naming)
5. The **Output Directory**

Barry will then securely generate a tailored JSON, compile it via LaTeX, and output your ATS-ready PDF!

### Example Files
Check the `examples/` directory in this repository for a sample `resume_data.json` and `resume_template.tex` to see exactly how your input files should be structured.

## 🤝 Contributing
Contributions, issues and feature requests are always welcome!
